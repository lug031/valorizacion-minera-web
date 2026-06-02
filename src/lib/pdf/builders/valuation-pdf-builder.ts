import type { ValuationSnapshot } from "@/lib/valuation/snapshot-types";
import type { ValuationCalculationResult, ScenarioCommercialParams } from "@/lib/valuation/snapshot-types";
import { normalizeGradeToOzTc } from "@/lib/pdf/grade-conversion";
import {
  formatPdfMoney,
  formatPdfDecimal,
  formatPdfPercent,
  formatPdfDate,
  formatPdfDateTime,
} from "@/lib/pdf/formatters";
import { DEFAULT_PDF_BRANDING, PDF_TEMPLATE_VERSION } from "@/lib/pdf/pdf-config";
import type { ValuationPdfViewModel } from "@/lib/pdf/types/valuation-pdf-view-model";
import { renderValuationPdfHtml } from "@/lib/pdf/templates/valuation-template";

export interface ValuationPdfMeta {
  code: string;
  fecha: string;
  materialTypeCode: string;
  providerName?: string | null;
  observaciones?: string | null;
  operatorName: string;
}

function resolveScenarioIndex(snapshot: ValuationSnapshot, scenarioIndex?: number): number {
  if (scenarioIndex != null) {
    return Math.max(0, Math.min(scenarioIndex, snapshot.scenarios.length - 1));
  }
  const idx = snapshot.activeScenarioIndex ?? 0;
  return Math.max(0, Math.min(idx, snapshot.scenarios.length - 1));
}

function multiplyMoney(perTms: string, tms: string): string {
  const v = parseFloat(perTms || "0") * parseFloat(tms || "0");
  if (Number.isNaN(v)) return "—";
  return formatPdfMoney(v.toFixed(2));
}

function buildMetalRows(
  params: ScenarioCommercialParams,
  result: ValuationCalculationResult,
  lot: ValuationSnapshot["lot"]
): ValuationPdfViewModel["metalRows"] {
  const scenarioResult =
    result.scenarios.find((r) => r.label === params.label) ?? result.scenarios[0];
  const tms = result.tms;
  const leyGold = normalizeGradeToOzTc(lot.goldGrade, lot.goldGradeUnit);
  const leySilver = normalizeGradeToOzTc(lot.silverGrade, lot.silverGradeUnit);
  const auPerTms = scenarioResult?.valorAuPerTms ?? "0";
  const agPerTms = scenarioResult?.valorAgPerTms ?? "0";

  return [
    {
      metal: "Au",
      leyOzTc: formatPdfDecimal(String(leyGold), 3),
      recPercent: formatPdfPercent(lot.recPercentGold),
      maquila: formatPdfDecimal(params.maquila, 0),
      proteccion: formatPdfMoney(params.rcGold),
      interUs: formatPdfMoney(params.interGold),
      precioTms: formatPdfMoney(auPerTms),
      importeUs: multiplyMoney(auPerTms, tms),
    },
    {
      metal: "Ag",
      leyOzTc: formatPdfDecimal(String(leySilver), 3),
      recPercent: formatPdfPercent(lot.recPercentSilver),
      maquila: "—",
      proteccion: formatPdfMoney(params.rcSilver),
      interUs: formatPdfMoney(params.interSilver),
      precioTms: formatPdfMoney(agPerTms),
      importeUs: multiplyMoney(agPerTms, tms),
    },
  ];
}

function buildSummary(
  params: ScenarioCommercialParams,
  result: ValuationCalculationResult,
  tmh: string
): ValuationPdfViewModel["summary"] {
  const scenarioResult =
    result.scenarios.find((r) => r.label === params.label) ?? result.scenarios[0];
  const tms = result.tms;
  const valorFinalPerTms = scenarioResult?.valorFinalPerTms ?? "0";
  const valorCompraTotal = scenarioResult?.valorCompraTotal ?? "0";
  const consumosTotal = parseFloat(params.consumos || "0") * parseFloat(tms || "0");
  const otrosTotal = parseFloat(params.otrosCostos ?? "0") * parseFloat(tmh || "0");

  return {
    totalAuAg: formatPdfMoney(valorCompraTotal),
    valorPorTmsAuAg: formatPdfMoney(valorFinalPerTms),
    consumosPerTms: formatPdfMoney(params.consumos),
    consumosTotal: formatPdfMoney(consumosTotal.toFixed(2)),
    costosAsignadosPerTmh:
      parseFloat(params.otrosCostos ?? "0") > 0 ? formatPdfMoney(params.otrosCostos ?? "0") : "—",
    costosAsignadosTotal:
      parseFloat(params.otrosCostos ?? "0") > 0 ? formatPdfMoney(otrosTotal.toFixed(2)) : "—",
    totalMenosConsumos: formatPdfMoney(valorCompraTotal),
    valorFinalPorTms: formatPdfMoney(valorFinalPerTms),
  };
}

export function buildPdfViewModelFromSnapshot(
  snapshot: ValuationSnapshot,
  meta: ValuationPdfMeta,
  scenarioIndex?: number,
  branding = DEFAULT_PDF_BRANDING
): ValuationPdfViewModel {
  const idx = resolveScenarioIndex(snapshot, scenarioIndex);
  const params = snapshot.scenarios[idx];
  const lot = snapshot.lot;

  return {
    lotTitle: `LOTE N° ${meta.code}`,
    loteCode: meta.code,
    fecha: formatPdfDate(meta.fecha),
    operatorName: meta.operatorName,
    materialTypeCode: meta.materialTypeCode,
    providerName: meta.providerName ?? null,
    tmh: formatPdfDecimal(lot.tmh, 3),
    h2oPercent: formatPdfPercent(lot.h2oPercent),
    tms: formatPdfDecimal(snapshot.results.tms, 3),
    metalRows: buildMetalRows(params, snapshot.results, lot),
    summary: buildSummary(params, snapshot.results, lot.tmh),
    observaciones: meta.observaciones?.trim() ?? "",
    generatedAt: formatPdfDateTime(new Date().toISOString()),
    formulaVersion: snapshot.formulaVersion,
    templateVersion: PDF_TEMPLATE_VERSION,
    disclaimer: branding.disclaimer,
    calculatedAt: formatPdfDateTime(snapshot.calculatedAt),
  };
}

export function buildValuationPdfHtmlFromSnapshot(
  snapshot: ValuationSnapshot,
  meta: ValuationPdfMeta,
  scenarioIndex?: number
): string {
  const vm = buildPdfViewModelFromSnapshot(snapshot, meta, scenarioIndex);
  return renderValuationPdfHtml(vm);
}
