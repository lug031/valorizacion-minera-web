import { adminDataClient } from "@/lib/amplify/data-client";
import { LIST_PAGE_SIZE } from "@/lib/pagination/constants";
import { getPrimaryTotals, tryParseSnapshot } from "@/lib/valuation/try-parse-snapshot";
import type {
  ValuationFilters,
  ValuationListItem,
  ValuationRecord,
} from "@/features/valuations/schemas/valuation-filters.schema";

export interface ValuationListPage {
  items: ValuationListItem[];
  nextToken: string | null;
}

function mapRow(row: {
  id: string;
  code: string;
  fecha: string;
  materialTypeCode: string;
  providerName?: string | null;
  observaciones?: string | null;
  formulaVersion: string;
  snapshotJson: string;
  syncStatus?: string | null;
  mobileId?: string | null;
  createdByUserId?: string | null;
  createdByUsername?: string | null;
  createdByDisplayName?: string | null;
  fieldDeviceId?: string | null;
  fieldDeviceLabel?: string | null;
  sourceCreatedAt?: string | null;
  sourceUpdatedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}): ValuationRecord {
  return {
    id: row.id,
    code: row.code,
    fecha: row.fecha,
    materialTypeCode: row.materialTypeCode,
    providerName: row.providerName ?? null,
    observaciones: row.observaciones ?? null,
    formulaVersion: row.formulaVersion,
    snapshotJson: row.snapshotJson,
    syncStatus: row.syncStatus ?? null,
    mobileId: row.mobileId ?? null,
    createdByUserId: row.createdByUserId ?? null,
    createdByUsername: row.createdByUsername ?? null,
    createdByDisplayName: row.createdByDisplayName ?? null,
    fieldDeviceId: row.fieldDeviceId ?? null,
    fieldDeviceLabel: row.fieldDeviceLabel ?? null,
    sourceCreatedAt: row.sourceCreatedAt ?? null,
    sourceUpdatedAt: row.sourceUpdatedAt ?? null,
    createdAt: row.createdAt ?? null,
    updatedAt: row.updatedAt ?? null,
  };
}

function toListItem(record: ValuationRecord): ValuationListItem {
  const snapshot = tryParseSnapshot(record.snapshotJson);
  const totals = getPrimaryTotals(snapshot);
  return {
    ...record,
    valorCompraTotal: totals.valorCompraTotal,
    tms: totals.tms,
    snapshotValid: snapshot !== null,
  };
}

function buildAmplifyFilter(filters: ValuationFilters) {
  const parts: Record<string, unknown>[] = [];

  const code = filters.code?.trim();
  if (code) parts.push({ code: { contains: code } });

  const mat = filters.materialTypeCode?.trim();
  if (mat) parts.push({ materialTypeCode: { eq: mat } });

  const provider = filters.providerName?.trim();
  if (provider) parts.push({ providerName: { contains: provider } });

  const sync = filters.syncStatus?.trim();
  if (sync) parts.push({ syncStatus: { eq: sync } });

  const operator = filters.operator?.trim();
  if (operator) {
    parts.push({
      or: [
        { createdByUsername: { contains: operator } },
        { createdByDisplayName: { contains: operator } },
      ],
    });
  }

  const device = filters.device?.trim();
  if (device) {
    parts.push({
      or: [
        { fieldDeviceLabel: { contains: device } },
        { fieldDeviceId: { contains: device } },
      ],
    });
  }

  const from = filters.fechaFrom?.trim();
  const to = filters.fechaTo?.trim();
  if (from && to) {
    parts.push({ fecha: { between: [from, to] } });
  } else if (from) {
    parts.push({ fecha: { ge: from } });
  } else if (to) {
    parts.push({ fecha: { le: to } });
  }

  if (parts.length === 0) return undefined;
  if (parts.length === 1) return parts[0];
  return { and: parts };
}

function sortItems(items: ValuationListItem[]): ValuationListItem[] {
  return [...items].sort((a, b) => {
    const da = a.createdAt ?? a.fecha;
    const db = b.createdAt ?? b.fecha;
    return db.localeCompare(da);
  });
}

export async function listValuationsPage(
  filters: ValuationFilters = {},
  nextToken?: string | null
): Promise<ValuationListPage> {
  const { data, errors, nextToken: token } = await adminDataClient.models.Valuation.list({
    filter: buildAmplifyFilter(filters),
    limit: LIST_PAGE_SIZE,
    nextToken: nextToken ?? undefined,
  });
  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join("; "));
  }

  const items = sortItems((data ?? []).map(mapRow).map(toListItem));
  return { items, nextToken: token ?? null };
}

/** Compatibilidad: primera página completa (máx. una página en memoria). */
export async function listValuations(filters: ValuationFilters = {}): Promise<ValuationListItem[]> {
  const page = await listValuationsPage(filters);
  return page.items;
}

export async function getValuationById(id: string): Promise<ValuationRecord | null> {
  const { data, errors } = await adminDataClient.models.Valuation.get({ id });
  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join("; "));
  }
  return data ? mapRow(data) : null;
}
