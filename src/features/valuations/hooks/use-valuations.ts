"use client";

import { useQuery } from "@tanstack/react-query";
import { getValuationById, listValuations } from "@/services/valuation.service";
import type { ValuationFilters } from "@/features/valuations/schemas/valuation-filters.schema";

export function useValuations(filters: ValuationFilters) {
  return useQuery({
    queryKey: ["valuations", filters],
    queryFn: () => listValuations(filters),
  });
}

export function useValuation(id: string | undefined) {
  return useQuery({
    queryKey: ["valuation", id],
    queryFn: () => {
      if (!id) throw new Error("ID requerido");
      return getValuationById(id);
    },
    enabled: Boolean(id),
  });
}
