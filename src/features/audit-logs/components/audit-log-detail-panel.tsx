"use client";

import { Button } from "@/components/ui/button";
import {
  auditActionLabel,
  auditEntityTypeLabel,
  formatAuditPayload,
} from "@/features/audit-logs/lib/format-audit-display";
import type { AuditLogRecord } from "@/services/audit-log.service";
import { formatDisplayDateTime } from "@/lib/valuation/format";

interface Props {
  record: AuditLogRecord | null;
  onClose: () => void;
}

export function AuditLogDetailPanel({ record, onClose }: Props) {
  if (!record) return null;

  return (
    <div className="mb-4 rounded-lg border border-primary/20 bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">Detalle del evento</p>
          <p className="mt-1 text-xs text-muted-foreground font-mono">{record.id}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Cerrar
        </Button>
      </div>
      <dl className="grid gap-2 text-sm md:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Fecha</dt>
          <dd>{formatDisplayDateTime(record.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Usuario (ID)</dt>
          <dd className="font-mono text-xs break-all">{record.userId ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Entidad</dt>
          <dd>{auditEntityTypeLabel(record.entityType)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">ID entidad</dt>
          <dd className="font-mono text-xs break-all">{record.entityId}</dd>
        </div>
        <div className="md:col-span-2">
          <dt className="text-muted-foreground">Acción</dt>
          <dd>
            {auditActionLabel(record.action)}
            <span className="ml-2 font-mono text-xs text-muted-foreground">({record.action})</span>
          </dd>
        </div>
      </dl>
      <div className="mt-4">
        <p className="mb-2 text-sm font-medium text-muted-foreground">Datos adicionales</p>
        <pre className="max-h-64 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
          {formatAuditPayload(record.payloadJson)}
        </pre>
      </div>
    </div>
  );
}
