"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuditLogFilters } from "@/features/audit-logs/schemas/audit-log-filters.schema";

const ENTITY_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "field_device", label: "Dispositivo móvil" },
  { value: "field_device_session", label: "Sesión de dispositivo" },
  { value: "valuation_sync", label: "Cotización (sync)" },
];

interface Props {
  filters: AuditLogFilters;
  onChange: (filters: AuditLogFilters) => void;
  onApply: () => void;
  onClear: () => void;
}

export function AuditLogsFiltersBar({ filters, onChange, onApply, onClear }: Props) {
  const set = (patch: Partial<AuditLogFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="mb-4 rounded-lg border bg-card p-4">
      <p className="mb-3 text-sm font-medium text-primary">Filtros</p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="space-y-2">
          <Label htmlFor="audit-filter-from">Desde</Label>
          <Input
            id="audit-filter-from"
            type="date"
            value={filters.from ?? ""}
            onChange={(e) => set({ from: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="audit-filter-to">Hasta</Label>
          <Input
            id="audit-filter-to"
            type="date"
            value={filters.to ?? ""}
            onChange={(e) => set({ to: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="audit-filter-entity">Tipo de entidad</Label>
          <select
            id="audit-filter-entity"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filters.entityType ?? ""}
            onChange={(e) => set({ entityType: e.target.value })}
          >
            {ENTITY_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="audit-filter-entity-id">ID entidad</Label>
          <Input
            id="audit-filter-entity-id"
            placeholder="UUID o código"
            value={filters.entityId ?? ""}
            onChange={(e) => set({ entityId: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="audit-filter-action">Acción</Label>
          <Input
            id="audit-filter-action"
            placeholder="ej. enrollFieldDevice"
            value={filters.action ?? ""}
            onChange={(e) => set({ action: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="audit-filter-user">Usuario (ID)</Label>
          <Input
            id="audit-filter-user"
            placeholder="ID de usuario campo"
            value={filters.userId ?? ""}
            onChange={(e) => set({ userId: e.target.value })}
          />
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
