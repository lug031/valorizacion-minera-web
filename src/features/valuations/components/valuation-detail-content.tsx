"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ValuationSnapshotReadonly } from "@/features/valuations/components/valuation-snapshot-readonly";
import { useValuation } from "@/features/valuations/hooks/use-valuations";
import { tryParseSnapshot } from "@/lib/valuation/try-parse-snapshot";
import { formatApiError } from "@/lib/errors/format-api-error";
import { formatDisplayDate, formatDisplayDateTime, syncStatusLabel } from "@/lib/valuation/format";

interface Props {
  id: string;
}

export function ValuationDetailContent({ id }: Props) {
  const { data, isLoading, error } = useValuation(id);

  if (isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Cargando cotización…</p>;
  }

  if (error) {
    return (
      <p className="p-6 text-sm text-destructive">
        {formatApiError(error, "No se pudo cargar el detalle de la valorización.")}
      </p>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Valorización no encontrada.</p>
        <Link href="/admin/valorizaciones" className="mt-4 inline-block">
          <Button variant="outline">Volver al listado</Button>
        </Link>
      </div>
    );
  }

  const snapshot = tryParseSnapshot(data.snapshotJson);

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/admin/valorizaciones">
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="h-4 w-4" />
            Volver al listado
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl font-mono">{data.code}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDisplayDate(data.fecha)} · MAT {data.materialTypeCode}
                {data.providerName ? ` · ${data.providerName}` : ""}
              </p>
            </div>
            <Badge className="border-slate-200 bg-slate-50 text-slate-700">
              {syncStatusLabel(data.syncStatus)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Versión de cálculo</p>
            <p className="font-medium">{data.formulaVersion}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Referencia de origen</p>
            <p className="font-medium font-mono text-xs">{data.mobileId ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Registrado por</p>
            <p className="font-medium">{data.createdByUserId ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Registrado</p>
            <p className="font-medium">{formatDisplayDateTime(data.createdAt)}</p>
          </div>
          {data.observaciones ? (
            <div className="sm:col-span-2 lg:col-span-4">
              <p className="text-xs text-muted-foreground">Observaciones</p>
              <p className="font-medium">{data.observaciones}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {!snapshot ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-lg text-destructive">No se pudo abrir esta cotización</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Los datos del registro están dañados o incompletos. No es posible mostrar el detalle de la
            valorización. Contacte al administrador del sistema si el problema persiste.
          </CardContent>
        </Card>
      ) : (
        <ValuationSnapshotReadonly snapshot={snapshot} />
      )}
    </div>
  );
}
