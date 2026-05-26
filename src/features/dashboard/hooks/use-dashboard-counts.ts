"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardCounts } from "@/services/dashboard.service";

export function useDashboardCounts() {
  return useQuery({
    queryKey: ["dashboard-counts"],
    queryFn: getDashboardCounts,
    staleTime: 60_000,
  });
}
