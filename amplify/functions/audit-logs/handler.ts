import type { AppSyncResolverHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { env } from "$amplify/env/audit-logs";
import type { Schema } from "../../data/resource";

type AuditLogConnection = Schema["AuditLogConnection"]["type"];

type AuditLogItem = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  payloadJson?: string | null;
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
};

type AuditLogsEvent = {
  fieldName?: string;
  info?: { fieldName?: string };
  arguments: Record<string, unknown>;
};

const doc = DynamoDBDocumentClient.from(new DynamoDBClient());
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function resolveFieldName(event: AuditLogsEvent): string {
  const field = event.fieldName ?? event.info?.fieldName;
  if (!field) throw new Error("Operación no soportada: nombre de campo no disponible");
  return field;
}

function auditLogTableName(): string {
  const name = env.AUDITLOG_TABLE_NAME;
  if (!name) throw new Error("Tabla AuditLog no configurada");
  return name;
}

function optionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text || null;
}

function parseLimit(value: unknown): number {
  const asNum = typeof value === "number" ? value : Number(value ?? DEFAULT_LIMIT);
  if (!Number.isFinite(asNum) || asNum <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.floor(asNum), MAX_LIMIT);
}

function parseNextToken(nextToken: string | null): Record<string, unknown> | undefined {
  if (!nextToken) return undefined;
  try {
    const parsed = JSON.parse(nextToken) as Record<string, unknown>;
    return parsed;
  } catch {
    throw new Error("nextToken inválido");
  }
}

function buildFilter(
  args: Record<string, unknown>
): {
  FilterExpression?: string;
  ExpressionAttributeValues?: Record<string, unknown>;
} {
  const parts: string[] = [];
  const values: Record<string, unknown> = {};

  const entityType = optionalText(args.entityType);
  const entityId = optionalText(args.entityId);
  const action = optionalText(args.action);
  const userId = optionalText(args.userId);
  const from = optionalText(args.from);
  const to = optionalText(args.to);

  if (entityType) {
    parts.push("entityType = :entityType");
    values[":entityType"] = entityType;
  }
  if (entityId) {
    parts.push("entityId = :entityId");
    values[":entityId"] = entityId;
  }
  if (action) {
    parts.push("action = :action");
    values[":action"] = action;
  }
  if (userId) {
    parts.push("userId = :userId");
    values[":userId"] = userId;
  }
  if (from) {
    parts.push("createdAt >= :from");
    values[":from"] = from;
  }
  if (to) {
    parts.push("createdAt <= :to");
    values[":to"] = to;
  }

  if (parts.length === 0) return {};
  return {
    FilterExpression: parts.join(" AND "),
    ExpressionAttributeValues: values,
  };
}

function toRecord(item: AuditLogItem): Schema["AuditLogRecord"]["type"] {
  return {
    id: item.id,
    entityType: item.entityType,
    entityId: item.entityId,
    action: item.action,
    payloadJson: item.payloadJson ?? null,
    userId: item.userId ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

async function handleListAuditLogs(event: AuditLogsEvent): Promise<AuditLogConnection> {
  const limit = parseLimit(event.arguments.limit);
  const nextToken = optionalText(event.arguments.nextToken);
  const startKey = parseNextToken(nextToken);
  const filter = buildFilter(event.arguments);

  const res = await doc.send(
    new ScanCommand({
      TableName: auditLogTableName(),
      Limit: limit,
      ExclusiveStartKey: startKey,
      ...filter,
    })
  );
  const items = ((res.Items ?? []) as AuditLogItem[])
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toRecord);

  return {
    items,
    nextToken: res.LastEvaluatedKey ? JSON.stringify(res.LastEvaluatedKey) : null,
  };
}

export const handler: AppSyncResolverHandler<Record<string, unknown>, AuditLogConnection | null> = async (
  event
) => {
  const auditEvent = event as AuditLogsEvent;
  const field = resolveFieldName(auditEvent);
  switch (field) {
    case "listAuditLogs":
      return await handleListAuditLogs(auditEvent);
    default:
      throw new Error(`Operación no soportada: ${field}`);
  }
};
