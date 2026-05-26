"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ValuationFilters } from "@/features/valuations/schemas/valuation-filters.schema";

const SYNC_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "local", label: "Borrador" },
  { value: "synced", label: "Registrado" },
  { value: "pending", label: "Pendiente" },
];

interface Props {
  filters: ValuationFilters;
  onChange: (filters: ValuationFilters) => void;
  onApply: () => void;
  onClear: () => void;
}

export function ValuationFiltersBar({ filters, onChange, onApply, onClear }: Props) {
  const set = (patch: Partial<ValuationFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="mb-4 rounded-lg border bg-card p-4">
      <p className="mb-3 text-sm font-medium text-primary">Filtros de búsqueda</p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="space-y-2">
          <Label htmlFor="filter-code">Código</Label>
          <Input
            id="filter-code"
            placeholder="COT-..."
            value={filters.code ?? ""}
            onChange={(e) => set({ code: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter-fecha-from">Fecha desde</Label>
          <Input
            id="filter-fecha-from"
            type="date"
            value={filters.fechaFrom ?? ""}
            onChange={(e) => set({ fechaFrom: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter-fecha-to">Fecha hasta</Label>
          <Input
            id="filter-fecha-to"
            type="date"
            value={filters.fechaTo ?? ""}
            onChange={(e) => set({ fechaTo: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter-mat">Tipo MAT</Label>
          <Input
            id="filter-mat"
            placeholder="MSC"
            value={filters.materialTypeCode ?? ""}
            onChange={(e) => set({ materialTypeCode: e.target.value.toUpperCase() })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter-provider">Proveedor</Label>
          <Input
            id="filter-provider"
            placeholder="Nombre"
            value={filters.providerName ?? ""}
            onChange={(e) => set({ providerName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter-sync">Estado</Label>
          <select
            id="filter-sync"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filters.syncStatus ?? ""}
            onChange={(e) => set({ syncStatus: e.target.value })}
          >
            {SYNC_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button type="button" onClick={onApply}>
          Buscar
        </Button>
        <Button type="button" variant="outline" onClick={onClear}>
          Limpiar
        </Button>
      </div>
    </div>
  );
}
