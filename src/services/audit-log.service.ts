import { adminDataClient } from "@/lib/amplify/data-client";
import type { AuditLogFilters } from "@/features/audit-logs/schemas/audit-log-filters.schema";

export type AuditLogRecord = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  payloadJson: string | null;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuditLogListPage = {
  items: AuditLogRecord[];
  nextToken: string | null;
};

const DEFAULT_LIMIT = 50;

function trimOrUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function toIsoFromDateStart(dateOnly: string | undefined): string | undefined {
  const trimmed = dateOnly?.trim();
  if (!trimmed) return undefined;
  const date = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Fecha desde inválida");
  }
  return date.toISOString();
}

function toIsoFromDateEnd(dateOnly: string | undefined): string | undefined {
  const trimmed = dateOnly?.trim();
  if (!trimmed) return undefined;
  const date = new Date(`${trimmed}T23:59:59.999Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Fecha hasta inválida");
  }
  return date.toISOString();
}

function mapRecord(row: {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  payloadJson?: string | null;
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
}): AuditLogRecord {
  return {
    id: row.id,
    entityType: row.entityType,
    entityId: row.entityId,
    action: row.action,
    payloadJson: row.payloadJson ?? null,
    userId: row.userId ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listAuditLogsPage(
  filters: AuditLogFilters,
  nextToken?: string | null
): Promise<AuditLogListPage> {
  const { data, errors } = await adminDataClient.queries.listManagedAuditLogs({
    entityType: trimOrUndefined(filters.entityType),
    entityId: trimOrUndefined(filters.entityId),
    action: trimOrUndefined(filters.action),
    userId: trimOrUndefined(filters.userId),
    from: toIsoFromDateStart(filters.from),
    to: toIsoFromDateEnd(filters.to),
    limit: DEFAULT_LIMIT,
    nextToken: nextToken ?? undefined,
  });

  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join("; "));
  }

  const connection = data;
  if (!connection) {
    return { items: [], nextToken: null };
  }

  return {
    items: (connection.items ?? [])
      .filter((row): row is NonNullable<typeof row> => row != null)
      .map(mapRecord),
    nextToken: connection.nextToken ?? null,
  };
}
