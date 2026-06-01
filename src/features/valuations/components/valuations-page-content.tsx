"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadMoreFooter } from "@/components/ui/load-more-footer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ValuationFiltersBar } from "@/features/valuations/components/valuation-filters-bar";
import { useValuations } from "@/features/valuations/hooks/use-valuations";
import {
  emptyValuationFilters,
  hasActiveValuationFilters,
  type ValuationFilters,
} from "@/features/valuations/schemas/valuation-filters.schema";
import { formatApiError } from "@/lib/errors/format-api-error";
import { formatDisplayDate, formatMoney, syncStatusLabel } from "@/lib/valuation/format";

const SYNC_EMPTY_MESSAGE =
  "Aún no hay cotizaciones registradas en el panel. Las operaciones de campo se guardan hoy en cada teléfono.";

function syncBadge(status: string | null) {
  const label = syncStatusLabel(status);
  if (status === "synced") {
    return <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">{label}</Badge>;
  }
  if (status === "pending") {
    return <Badge className="border-amber-200 bg-amber-50 text-amber-800">{label}</Badge>;
  }
  return <Badge className="border-slate-200 bg-slate-50 text-slate-600">{label}</Badge>;
}

export function ValuationsPageContent() {
  const [draftFilters, setDraftFilters] = useState<ValuationFilters>(emptyValuationFilters);
  const [appliedFilters, setAppliedFilters] = useState<ValuationFilters>(emptyValuationFilters);
  const { data, isLoading, error, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useValuations(appliedFilters);

  const rows = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const filtersActive = hasActiveValuationFilters(appliedFilters);

  return (
    <div className="p-6">
      <p className="mb-4 text-sm text-muted-foreground">
        Consulta centralizada de cotizaciones registradas en el sistema.
      </p>

      <ValuationFiltersBar
        filters={draftFilters}
        onChange={setDraftFilters}
        onApply={() => setAppliedFilters({ ...draftFilters })}
        onClear={() => {
          setDraftFilters(emptyValuationFilters);
          setAppliedFilters(emptyValuationFilters);
        }}
      />

      {isFetching && !isLoading && !isFetchingNextPage ? (
        <p className="mb-2 text-xs text-muted-foreground">Actualizando…</p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando valorizaciones…</p>
      ) : error ? (
        <p className="text-sm text-destructive">
          {formatApiError(error, "No se pudo cargar el listado de valorizaciones.")}
        </p>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>MAT</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Total compra</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Registrado por</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center">
                    {filtersActive ? (
                      <p className="text-muted-foreground">
                        No hay valorizaciones que coincidan con los filtros aplicados.
                      </p>
                    ) : (
                      <div className="mx-auto max-w-lg space-y-2">
                        <p className="font-medium text-[#001c23]">Sin valorizaciones registradas</p>
                        <p className="text-sm text-muted-foreground">{SYNC_EMPTY_MESSAGE}</p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono font-medium">{row.code}</TableCell>
                    <TableCell>{formatDisplayDate(row.fecha)}</TableCell>
                    <TableCell>{row.materialTypeCode}</TableCell>
                    <TableCell className="max-w-[160px] truncate">
                      {row.providerName ?? "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {row.snapshotValid ? (
                        formatMoney(row.valorCompraTotal)
                      ) : (
                        <span className="text-xs text-amber-700">Datos incompletos</span>
                      )}
                    </TableCell>
                    <TableCell>{syncBadge(row.syncStatus)}</TableCell>
                    <TableCell className="max-w-[120px] truncate text-xs text-muted-foreground">
                      {row.createdByUserId ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/valorizaciones/${row.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                          Ver detalle
                        </Button>
                      </Link>
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
