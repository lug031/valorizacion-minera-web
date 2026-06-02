import type { ValuationPdfViewModel } from "@/lib/pdf/types/valuation-pdf-view-model";
import { escapeHtml } from "@/lib/pdf/formatters";

function renderMetalRow(row: ValuationPdfViewModel["metalRows"][0], vm: ValuationPdfViewModel): string {
  return `
    <tr class="metal-row">
      <td class="metal-label">${row.metal}</td>
      <td>${escapeHtml(vm.loteCode)}</td>
      <td>${escapeHtml(vm.fecha)}</td>
      <td class="num">${vm.tmh}</td>
      <td class="num accent">${vm.h2oPercent}</td>
      <td class="num accent">${vm.tms}</td>
      <td class="num accent">${row.leyOzTc}</td>
      <td class="num accent">${row.recPercent}</td>
      <td class="num accent">${row.maquila}</td>
      <td class="num">${row.proteccion}</td>
      <td class="num">${row.interUs}</td>
      <td class="num">${row.precioTms}</td>
      <td class="num">${row.importeUs}</td>
    </tr>
  `;
}

/** Preliquidación por lote — mismo formato que la app móvil. */
export function renderValuationPdfHtml(vm: ValuationPdfViewModel): string {
  const metalRows = vm.metalRows.map((r) => renderMetalRow(r, vm)).join("");
  const observacionesBlock = vm.observaciones
    ? `<p class="obs"><strong>Observaciones:</strong> ${escapeHtml(vm.observaciones)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(vm.loteCode)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10px;
      color: #111;
      margin: 0;
      padding: 16px;
    }
    .lot-box {
      border: 2px solid #1a3a5c;
      padding: 10px 12px 14px;
    }
    .lot-title {
      font-size: 13px;
      font-weight: bold;
      color: #1a3a5c;
      margin: 0 0 10px;
    }
    .lot-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
    }
    .lot-table th {
      background: #e8eef4;
      border: 1px solid #333;
      padding: 5px 4px;
      text-align: center;
      font-weight: 700;
    }
    .lot-table td {
      border: 1px solid #333;
      padding: 5px 4px;
      text-align: center;
    }
    .metal-label { font-weight: bold; background: #f5f5f5; }
    .num { text-align: right; font-weight: 600; }
    .accent { color: #c00000; font-weight: 700; }
    .summary-wrap { display: flex; justify-content: flex-end; margin-top: 10px; }
    .summary-table { border-collapse: collapse; font-size: 9px; min-width: 280px; }
    .summary-table td { border: 1px solid #333; padding: 4px 8px; }
    .summary-table .label { text-align: left; font-weight: 600; }
    .summary-table .value { text-align: right; font-weight: 700; min-width: 90px; }
    .summary-table .highlight { background: #fff2cc; font-weight: 800; }
    .summary-table .final { font-weight: 800; font-size: 10px; }
    .disclaimer {
      color: #c00000;
      font-size: 8px;
      text-align: center;
      margin: 14px 8px 8px;
      line-height: 1.35;
    }
    .footer {
      font-size: 8px;
      color: #555;
      margin-top: 8px;
      border-top: 1px solid #ccc;
      padding-top: 6px;
    }
    .meta-line { margin-bottom: 2px; }
    .obs { font-size: 9px; margin: 8px 0; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="lot-box">
    <div class="lot-title">${escapeHtml(vm.lotTitle)}</div>
    <table class="lot-table">
      <thead>
        <tr>
          <th></th><th>Lote</th><th>Fecha</th><th>TMH</th><th>%H2O</th><th>TMS</th>
          <th>Ley Oz/Tc</th><th>%Rec</th><th>Maquila</th><th>Protección</th>
          <th>Inter US$</th><th>Precio TMS</th><th>Importe US$</th>
        </tr>
      </thead>
      <tbody>${metalRows}</tbody>
    </table>
    <div class="summary-wrap">
      <table class="summary-table">
        <tr><td class="label">Total Au + Ag</td><td class="value">${vm.summary.totalAuAg}</td></tr>
        <tr><td class="label">Valor por TMS Au + Ag</td><td class="value">${vm.summary.valorPorTmsAuAg}</td></tr>
        <tr><td class="label">Consumos US$/TMS</td><td class="value">${vm.summary.consumosPerTms}</td></tr>
        <tr><td class="label">Costos Asignados US$/TMH</td><td class="value">${vm.summary.costosAsignadosPerTmh}</td></tr>
        <tr><td class="label">Total Au + Ag - Consumos</td><td class="value highlight">${vm.summary.totalMenosConsumos}</td></tr>
        <tr><td class="label final">Valor por TMS Au + Ag</td><td class="value final">${vm.summary.valorFinalPorTms}</td></tr>
      </table>
    </div>
    <p class="disclaimer">${escapeHtml(vm.disclaimer)}</p>
    ${observacionesBlock}
  </div>
  <div class="footer">
    <p class="meta-line"><strong>Operador:</strong> ${escapeHtml(vm.operatorName)} · <strong>Tipo MAT:</strong> ${escapeHtml(vm.materialTypeCode)}</p>
    ${vm.providerName ? `<p class="meta-line"><strong>Proveedor:</strong> ${escapeHtml(vm.providerName)}</p>` : ""}
    <p class="meta-line"><strong>Documento generado:</strong> ${escapeHtml(vm.generatedAt)}</p>
  </div>
</body>
</html>`;
}
