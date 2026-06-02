const mockSend = jest.fn();

jest.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: {
    from: () => ({ send: mockSend }),
  },
  ScanCommand: jest.fn((input: unknown) => ({ input })),
}));

import { handler } from "../handler";

function invokeList(args: Record<string, unknown> = {}) {
  return handler(
    {
      fieldName: "listAuditLogs",
      arguments: args,
    } as never,
    {} as never,
    {} as never
  );
}

describe("audit-logs listAuditLogs", () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it("lista logs ordenados por createdAt DESC", async () => {
    mockSend.mockResolvedValueOnce({
      Items: [
        {
          id: "a1",
          entityType: "field_device",
          entityId: "dev-1",
          action: "enrollFieldDevice",
          payloadJson: "{}",
          userId: "u1",
          createdAt: "2026-06-02T08:00:00.000Z",
          updatedAt: "2026-06-02T08:00:00.000Z",
        },
        {
          id: "a2",
          entityType: "field_device",
          entityId: "dev-1",
          action: "assignManagedFieldDevice",
          payloadJson: "{}",
          userId: "u1",
          createdAt: "2026-06-02T09:00:00.000Z",
          updatedAt: "2026-06-02T09:00:00.000Z",
        },
      ],
    });

    const result = await invokeList();

    expect(result?.items).toHaveLength(2);
    expect(result?.items?.[0]?.id).toBe("a2");
    expect(result?.items?.[1]?.id).toBe("a1");
  });

  it("aplica filtros combinados en ScanCommand", async () => {
    mockSend.mockResolvedValueOnce({ Items: [] });

    await invokeList({
      entityType: "valuation_sync",
      entityId: "val-1",
      action: "pushMobileValuation_synced",
      userId: "user-1",
      from: "2026-06-01T00:00:00.000Z",
      to: "2026-06-02T00:00:00.000Z",
      limit: 25,
    });

    const input = mockSend.mock.calls[0][0].input as Record<string, unknown>;
    expect(input.FilterExpression).toContain("entityType = :entityType");
    expect(input.FilterExpression).toContain("entityId = :entityId");
    expect(input.FilterExpression).toContain("action = :action");
    expect(input.FilterExpression).toContain("userId = :userId");
    expect(input.FilterExpression).toContain("createdAt >= :from");
    expect(input.FilterExpression).toContain("createdAt <= :to");
    expect(input.ExpressionAttributeValues).toMatchObject({
      ":entityType": "valuation_sync",
      ":entityId": "val-1",
      ":action": "pushMobileValuation_synced",
      ":userId": "user-1",
      ":from": "2026-06-01T00:00:00.000Z",
      ":to": "2026-06-02T00:00:00.000Z",
    });
    expect(input.Limit).toBe(25);
  });

  it("devuelve nextToken serializado cuando LastEvaluatedKey existe", async () => {
    mockSend.mockResolvedValueOnce({
      Items: [],
      LastEvaluatedKey: { id: "next-id" },
    });

    const result = await invokeList();

    expect(result?.nextToken).toBe(JSON.stringify({ id: "next-id" }));
  });

  it("usa nextToken recibido como ExclusiveStartKey", async () => {
    mockSend.mockResolvedValueOnce({ Items: [] });
    const token = JSON.stringify({ id: "cursor-1" });

    await invokeList({ nextToken: token });

    const input = mockSend.mock.calls[0][0].input as Record<string, unknown>;
    expect(input.ExclusiveStartKey).toEqual({ id: "cursor-1" });
  });

  it("limita a MAX_LIMIT cuando limit es mayor", async () => {
    mockSend.mockResolvedValueOnce({ Items: [] });

    await invokeList({ limit: 1000 });

    const input = mockSend.mock.calls[0][0].input as Record<string, unknown>;
    expect(input.Limit).toBe(200);
  });

  it("rechaza nextToken inválido", async () => {
    await expect(invokeList({ nextToken: "no-json" })).rejects.toThrow("nextToken inválido");
    expect(mockSend).not.toHaveBeenCalled();
  });
});
