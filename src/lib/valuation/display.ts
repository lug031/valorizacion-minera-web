import type { ValuationRecord } from "@/features/valuations/schemas/valuation-filters.schema";

export function formatValuationOperator(record: ValuationRecord): string {
  return (
    record.createdByDisplayName?.trim() ||
    record.createdByUsername?.trim() ||
    record.createdByUserId?.trim() ||
    "—"
  );
}

export function formatValuationDevice(record: ValuationRecord): string {
  return record.fieldDeviceLabel?.trim() || record.fieldDeviceId?.trim() || "—";
}
