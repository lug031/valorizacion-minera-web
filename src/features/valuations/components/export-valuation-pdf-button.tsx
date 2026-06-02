"use client";

import { useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ValuationRecord } from "@/features/valuations/schemas/valuation-filters.schema";
import type { ValuationSnapshot } from "@/lib/valuation/snapshot-types";
import { formatValuationOperator } from "@/lib/valuation/display";
import { buildExportScenarioOptionsFromSnapshot } from "@/lib/pdf/export-scenario-options";
import { printValuationPdfFromSnapshot } from "@/lib/pdf/export-valuation-pdf";

interface Props {
  record: ValuationRecord;
  snapshot: ValuationSnapshot;
}

export function ExportValuationPdfButton({ record, snapshot }: Props) {
  const options = useMemo(() => buildExportScenarioOptionsFromSnapshot(snapshot), [snapshot]);
  const [scenarioIndex, setScenarioIndex] = useState(
    () => snapshot.activeScenarioIndex ?? 0
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    setError(null);
    setLoading(true);
    try {
      printValuationPdfFromSnapshot(
        snapshot,
        {
          code: record.code,
          fecha: record.fecha,
          materialTypeCode: record.materialTypeCode,
          providerName: record.providerName,
          observaciones: record.observaciones,
          operatorName: formatValuationOperator(record),
        },
        options.length > 1
          ? scenarioIndex
          : Math.min(snapshot.activeScenarioIndex ?? 0, options.length - 1)
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar el PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      {options.length > 1 ? (
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Escenario a exportar
          <select
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
            value={scenarioIndex}
            onChange={(e) => setScenarioIndex(Number(e.target.value))}
          >
            {options.map((opt) => (
              <option key={opt.scenarioIndex} value={opt.scenarioIndex}>
                {opt.name} ({opt.label}) — {opt.total}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <Button type="button" variant="outline" disabled={loading} onClick={handleExport}>
        <FileDown className="h-4 w-4" />
        {loading ? "Preparando PDF…" : "Exportar preliquidación (PDF)"}
      </Button>
      {error ? <p className="max-w-xs text-right text-xs text-destructive">{error}</p> : null}
      <p className="max-w-xs text-right text-xs text-muted-foreground">
        Se abrirá la impresión del navegador; elija «Guardar como PDF».
      </p>
    </div>
  );
}
