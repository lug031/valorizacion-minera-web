"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getActiveScenarioIndex,
  getActiveScenarioResult,
} from "@/lib/valuation/try-parse-snapshot";
import type { ValuationSnapshot } from "@/lib/valuation/snapshot-types";
import { formatMoney } from "@/lib/valuation/format";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium tabular-nums">{value || "—"}</p>
    </div>
  );
}

interface Props {
  snapshot: ValuationSnapshot;
}

export function ValuationSnapshotReadonly({ snapshot }: Props) {
  const scenarioIdx = getActiveScenarioIndex(snapshot);
  const commercial = snapshot.scenarios[scenarioIdx];
  const result = getActiveScenarioResult(snapshot);
  const lot = snapshot.lot;
  const calc = snapshot.results;

  if (!commercial || !result) {
    return (
      <p className="text-sm text-destructive">La cotización no contiene un escenario válido para mostrar.</p>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lote</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="TMH" value={lot.tmh} />
          <Field label="H2O %" value={lot.h2oPercent} />
          <Field label="TMS calculado" value={calc.tms} />
          <Field label="Escenario guardado" value={`${commercial.label} — ${commercial.name}`} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leyes y recuperación</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-amber-800">Oro</p>
            <Field label="Ley oz/tc" value={calc.leyGoldOzTc} />
            <Field label="REC %" value={lot.recPercentGold} />
            <Field label="Factor REC" value={calc.recFactorGold} />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-600">Plata</p>
            <Field label="Ley oz/tc" value={calc.leySilverOzTc} />
            <Field label="REC %" value={lot.recPercentSilver} />
            <Field label="Factor REC" value={calc.recFactorSilver} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Parámetros comerciales</CardTitle>
          <CardDescription>Escenario activo al guardar la cotización.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Maquila (US$)" value={commercial.maquila} />
          <Field label="Maquila usada" value={result.maquilaUsed} />
          <Field label="Factor" value={commercial.factor} />
          <Field label="RC oro (US$/oz)" value={commercial.rcGold} />
          <Field label="RC plata (US$/oz)" value={commercial.rcSilver} />
          <Field label="INTER oro (US$)" value={commercial.interGold} />
          <Field label="INTER plata (US$)" value={commercial.interSilver} />
          <Field label="Consumos (US$/TMS)" value={commercial.consumos} />
          <Field label="Flete (US$/TMS)" value={commercial.flete} />
          <Field label="Otros costos" value={commercial.otrosCostos ?? "—"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resultados</CardTitle>
          <CardDescription>
            Versión {snapshot.formulaVersion} · calculado el {snapshot.calculatedAt}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Valor AU x TMS" value={formatMoney(result.valorAuPerTms)} />
            <Field label="Valor AG x TMS" value={formatMoney(result.valorAgPerTms)} />
            <Field label="Valor final x TMS" value={formatMoney(result.valorFinalPerTms)} />
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
            <p className="text-xs text-muted-foreground">Valor compra total</p>
            <p className="text-xl font-semibold text-primary tabular-nums">
              {formatMoney(result.valorCompraTotal)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
