import { FieldValuationError } from '../errors';
import { createHmac } from 'node:crypto';

const mockSend = jest.fn();

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: () => ({ send: mockSend }),
  },
  ScanCommand: jest.fn((input: unknown) => ({ input })),
  PutCommand: jest.fn((input: unknown) => ({ input })),
}));

import { handler } from '../handler';

const VALID_FP = `vm-sha256:${'a'.repeat(64)}`;
const DEVICE_ID = 'device-1';
const USER_ID = 'user-1';
const SNAPSHOT = JSON.stringify({ results: { scenarios: [] } });
const SESSION_TOKEN_SECRET = 'test-device-session-secret';

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function createSessionToken(overrides: Record<string, unknown> = {}): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: USER_ID,
    cloudDeviceId: DEVICE_ID,
    deviceFingerprintHash: VALID_FP,
    tokenType: 'device_session',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60,
    ...overrides,
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac('sha256', SESSION_TOKEN_SECRET)
    .update(signingInput, 'utf8')
    .digest('base64url');
  return `${signingInput}.${signature}`;
}

function baseArgs(overrides: Record<string, unknown> = {}) {
  return {
    mobileId: 'val-mobile-1',
    code: 'VAL-001',
    fecha: '2026-05-01',
    materialTypeCode: 'MSC',
    formulaVersion: 'v1',
    snapshotJson: SNAPSHOT,
    createdByFieldUserId: USER_ID,
    createdByUsername: 'operator',
    sourceCreatedAt: '2026-05-01T00:00:00.000Z',
    sourceUpdatedAt: '2026-05-01T00:00:00.000Z',
    cloudDeviceId: DEVICE_ID,
    deviceFingerprintHash: VALID_FP,
    sessionToken: createSessionToken(),
    ...overrides,
  };
}

function enrolledDevice(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: DEVICE_ID,
    fieldUserId: USER_ID,
    deviceFingerprintHash: VALID_FP,
    status: 'enrolled',
    isBlocked: false,
    ...overrides,
  };
}

function activeUser() {
  return { id: USER_ID, username: 'operator', displayName: 'Op', isActive: true };
}

async function invokePush(args: Record<string, unknown> = baseArgs()) {
  return handler(
    {
      fieldName: 'pushMobileValuation',
      arguments: args,
    } as never,
    {} as never,
    {} as never
  );
}

describe('field-valuations pushMobileValuation', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it('crea valorización con dispositivo válido', async () => {
    mockSend
      .mockResolvedValueOnce({ Items: [] })
      .mockResolvedValueOnce({ Items: [enrolledDevice()] })
      .mockResolvedValueOnce({ Items: [activeUser()] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const result = await invokePush();

    expect(result?.cloudValuationId).toBeTruthy();
    expect(result?.alreadyExisted).toBe(false);
    expect(mockSend).toHaveBeenCalledTimes(5);
  });

  it('devuelve alreadyExisted si mobileId ya existe', async () => {
    mockSend.mockResolvedValueOnce({
      Items: [{ id: 'cloud-existing', mobileId: 'val-mobile-1', syncStatus: 'synced' }],
    });
    mockSend.mockResolvedValueOnce({});

    const result = await invokePush();

    expect(result?.cloudValuationId).toBe('cloud-existing');
    expect(result?.alreadyExisted).toBe(true);
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it('rechaza dispositivo revocado', async () => {
    mockSend
      .mockResolvedValueOnce({ Items: [] })
      .mockResolvedValueOnce({ Items: [enrolledDevice({ status: 'revoked' })] })
      .mockResolvedValueOnce({ Items: [activeUser()] });

    await expect(invokePush()).rejects.toMatchObject({
      code: 'DEVICE_REVOKED',
    });
  });

  it('rechaza fingerprint inválido', async () => {
    await expect(
      invokePush(baseArgs({ deviceFingerprintHash: 'not-a-valid-hash' }))
    ).rejects.toMatchObject({
      code: 'INVALID_FINGERPRINT',
    });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('rechaza fingerprint que no coincide', async () => {
    mockSend
      .mockResolvedValueOnce({ Items: [] })
      .mockResolvedValueOnce({
        Items: [enrolledDevice({ deviceFingerprintHash: `vm-sha256:${'b'.repeat(64)}` })],
      })
      .mockResolvedValueOnce({ Items: [activeUser()] });

    await expect(invokePush()).rejects.toMatchObject({
      code: 'FINGERPRINT_MISMATCH',
    });
  });

  it('rechaza payload demasiado grande', async () => {
    const huge = 'x'.repeat(512 * 1024 + 1);
    await expect(invokePush(baseArgs({ snapshotJson: JSON.stringify({ blob: huge }) }))).rejects.toMatchObject({
      code: 'PAYLOAD_TOO_LARGE',
    });
  });

  it('rechaza JSON inválido en snapshot', async () => {
    await expect(invokePush(baseArgs({ snapshotJson: '{not-json' }))).rejects.toMatchObject({
      code: 'INVALID_PAYLOAD',
    });
  });

  it('rechaza campo obligatorio vacío', async () => {
    await expect(invokePush(baseArgs({ code: '  ' }))).rejects.toMatchObject({
      code: 'INVALID_PAYLOAD',
    });
  });

  it('propaga FieldValuationError con código en mensaje', async () => {
    try {
      await invokePush(baseArgs({ code: '' }));
    } catch (e) {
      expect(e).toBeInstanceOf(FieldValuationError);
      expect((e as FieldValuationError).message).toMatch(/\[INVALID_PAYLOAD\]/);
    }
  });

  it('rechaza session token inválido', async () => {
    await expect(invokePush(baseArgs({ sessionToken: 'invalid.token.value' }))).rejects.toMatchObject({
      code: 'INVALID_SESSION_TOKEN',
    });
  });
});
