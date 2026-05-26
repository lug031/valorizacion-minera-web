"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getValuationById, listValuationsPage } from "@/services/valuation.service";
import type { ValuationFilters } from "@/features/valuations/schemas/valuation-filters.schema";

export function useValuations(filters: ValuationFilters) {
  return useInfiniteQuery({
    queryKey: ["valuations", filters],
    queryFn: ({ pageParam }) => listValuationsPage(filters, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextToken,
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
