"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  type ValuationFilters,
} from "@/features/valuations/schemas/valuation-filters.schema";
import { formatDisplayDate, formatMoney, syncStatusLabel } from "@/lib/valuation/format";

function syncBadge(status: string | null) {
  const label = syncStatusLabel(status);
  if (status === "synced") {
    return <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">{label}</Badge>;
  }
  if (status === "pending") {
    return <Badge className="border-amber-200 bg-amber-50 text-amber-800">{label}</Badge>;
  }
  if (status === "local" || !status) {
    return <Badge className="border-slate-200 bg-slate-50 text-slate-600">{label}</Badge>;
  }
  return <Badge className="border-slate-200 bg-slate-50 text-slate-600">{label}</Badge>;
}

export function ValuationsPageContent() {
  const [draftFilters, setDraftFilters] = useState<ValuationFilters>(emptyValuationFilters);
  const [appliedFilters, setAppliedFilters] = useState<ValuationFilters>(emptyValuationFilters);
  const { data, isLoading, error, isFetching } = useValuations(appliedFilters);

  return (
    <div className="p-6">
      <p className="mb-4 text-sm text-muted-foreground">
        Consulta centralizada de cotizaciones guardadas. Fuente preparada para sincronización desde la app móvil.
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

      {isFetching && !isLoading ? (
        <p className="mb-2 text-xs text-muted-foreground">Actualizando…</p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando valorizaciones…</p>
      ) : error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Error al cargar valorizaciones"}
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
                <TableHead>Sync</TableHead>
                <TableHead>Creado por</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    No hay valorizaciones que coincidan con los filtros.
                  </TableCell>
                </TableRow>
              ) : (
                (data ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono font-medium">{row.code}</TableCell>
                    <TableCell>{formatDisplayDate(row.fecha)}</TableCell>
                    <TableCell>{row.materialTypeCode}</TableCell>
                    <TableCell className="max-w-[160px] truncate">
                      {row.providerName ?? "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {row.snapshotValid ? formatMoney(row.valorCompraTotal) : (
                        <span className="text-amber-700 text-xs">Snapshot inválido</span>
                      )}
                    </TableCell>
                    <TableCell>{syncBadge(row.syncStatus)}</TableCell>
                    <TableCell className="max-w-[120px] truncate text-muted-foreground text-xs">
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
        </div>
      )}
    </div>
  );
}
