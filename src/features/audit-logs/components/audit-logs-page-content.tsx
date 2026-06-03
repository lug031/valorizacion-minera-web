"use client";

import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadMoreFooter } from "@/components/ui/load-more-footer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AuditLogsFiltersBar } from "@/features/audit-logs/components/audit-logs-filters-bar";
import { AuditLogDetailPanel } from "@/features/audit-logs/components/audit-log-detail-panel";
import { useAuditLogs } from "@/features/audit-logs/hooks/use-audit-logs";
import {
  auditActionLabel,
  auditEntityTypeLabel,
} from "@/features/audit-logs/lib/format-audit-display";
import {
  emptyAuditLogFilters,
  hasActiveAuditLogFilters,
} from "@/features/audit-logs/schemas/audit-log-filters.schema";
import type { AuditLogRecord } from "@/services/audit-log.service";
import { formatApiError } from "@/lib/errors/format-api-error";
import { formatDisplayDateTime } from "@/lib/valuation/format";

export function AuditLogsPageContent() {
  const [draftFilters, setDraftFilters] = useState(emptyAuditLogFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyAuditLogFilters);
  const [selected, setSelected] = useState<AuditLogRecord | null>(null);

  const { data, isLoading, error, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useAuditLogs(appliedFilters);

  const rows = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const filtersActive = hasActiveAuditLogFilters(appliedFilters);

  return (
    <div className="p-6">
      <p className="mb-4 text-sm text-muted-foreground">
        Registro de operaciones en dispositivos móviles y sincronización de cotizaciones. Solo lectura;
        los eventos se generan automáticamente en el servidor.
      </p>

      <AuditLogsFiltersBar
        filters={draftFilters}
        onChange={setDraftFilters}
        onApply={() => {
          setAppliedFilters({ ...draftFilters });
          setSelected(null);
        }}
        onClear={() => {
          setDraftFilters(emptyAuditLogFilters);
          setAppliedFilters(emptyAuditLogFilters);
          setSelected(null);
        }}
      />

      <AuditLogDetailPanel record={selected} onClose={() => setSelected(null)} />

      {isFetching && !isLoading && !isFetchingNextPage ? (
        <p className="mb-2 text-xs text-muted-foreground">Actualizando…</p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando auditoría…</p>
      ) : error ? (
        <p className="text-sm text-destructive">
          {formatApiError(error, "No se pudo cargar el registro de auditoría.")}
        </p>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Entidad</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>ID entidad</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead className="text-right">Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    {filtersActive
                      ? "No hay eventos que coincidan con los filtros."
                      : "Aún no hay eventos registrados o el listado está vacío para el rango seleccionado."}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} className={selected?.id === row.id ? "bg-muted/30" : undefined}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDisplayDateTime(row.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm">{auditEntityTypeLabel(row.entityType)}</TableCell>
                    <TableCell className="max-w-[220px] text-sm" title={row.action}>
                      {auditActionLabel(row.action)}
                    </TableCell>
                    <TableCell className="max-w-[140px] truncate font-mono text-xs" title={row.entityId}>
                      {row.entityId}
                    </TableCell>
                    <TableCell className="max-w-[120px] truncate font-mono text-xs" title={row.userId ?? ""}>
                      {row.userId ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelected(row)}
                        aria-label="Ver detalle"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <LoadMoreFooter
            hasMore={Boolean(hasNextPage)}
            loading={isFetchingNextPage}
            onLoadMore={() => void fetchNextPage()}
            shown={rows.length}
          />
        </div>
      )}
    </div>
  );
}
