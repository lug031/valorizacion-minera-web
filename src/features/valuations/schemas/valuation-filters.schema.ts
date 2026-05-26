import { z } from "zod";

export const valuationFiltersSchema = z.object({
  code: z.string().optional(),
  fechaFrom: z.string().optional(),
  fechaTo: z.string().optional(),
  materialTypeCode: z.string().optional(),
  providerName: z.string().optional(),
  syncStatus: z.string().optional(),
});

export type ValuationFilters = z.infer<typeof valuationFiltersSchema>;

export const emptyValuationFilters: ValuationFilters = {
  code: "",
  fechaFrom: "",
  fechaTo: "",
  materialTypeCode: "",
  providerName: "",
  syncStatus: "",
};

export function hasActiveValuationFilters(filters: ValuationFilters): boolean {
  return Boolean(
    filters.code?.trim() ||
      filters.fechaFrom?.trim() ||
      filters.fechaTo?.trim() ||
      filters.materialTypeCode?.trim() ||
      filters.providerName?.trim() ||
      filters.syncStatus?.trim()
  );
}

export interface ValuationRecord {
  id: string;
  code: string;
  fecha: string;
  materialTypeCode: string;
  providerName: string | null;
  observaciones: string | null;
  formulaVersion: string;
  snapshotJson: string;
  syncStatus: string | null;
  mobileId: string | null;
  createdByUserId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ValuationListItem extends ValuationRecord {
  valorCompraTotal: string | null;
  tms: string | null;
  snapshotValid: boolean;
}
