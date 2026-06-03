"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { listAuditLogsPage } from "@/services/audit-log.service";
import type { AuditLogFilters } from "@/features/audit-logs/schemas/audit-log-filters.schema";

export function useAuditLogs(filters: AuditLogFilters) {
  return useInfiniteQuery({
    queryKey: ["audit-logs", filters],
    queryFn: ({ pageParam }) => listAuditLogsPage(filters, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextToken,
  });
}
