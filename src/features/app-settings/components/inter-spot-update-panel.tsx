"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useCanWriteAdmin } from "@/providers/auth-provider";
import type { AppSettingsRecord } from "@/features/app-settings/schemas/app-settings.schema";
import { buildInterMetadataSummary } from "@/features/app-settings/utils/inter-metadata-display";
import { useInterSpotUpdate } from "@/features/app-settings/hooks/use-inter-spot-update";
import { formatApiError } from "@/lib/errors/format-api-error";
import type { InterSpotPreviewResponse } from "@/services/inter/inter-spot-types";

interface Props {
  settings: AppSettingsRecord;
}

export function InterSpotUpdatePanel({ settings }: Props) {
  const canWrite = useCanWriteAdmin();
  const { preview, apply } = useInterSpotUpdate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewData, setPreviewData] = useState<InterSpotPreviewResponse | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);

  const meta = buildInterMetadataSummary(settings);
  const busy = preview.isPending || apply.isPending;

  const onFetchPreview = async () => {
    setLocalError(null);
    setLocalSuccess(null);
    setPreviewData(null);
    try {
      const data = await preview.mutateAsync();
      setPreviewData(data);
      setConfirmOpen(true);
    } catch (e) {
      setLocalError(formatApiError(e, "No se pudo obtener precios internacionales."));
    }
  };

  const onConfirmApply = async () => {
    if (!previewData) return;
    setLocalError(null);
    setLocalSuccess(null);
    try {
      await apply.mutateAsync(previewData.quote);
      setConfirmOpen(false);
      setPreviewData(null);
      setLocalSuccess("INTER actualizado en la configuración maestra.");
    } catch (e) {
      setLocalError(formatApiError(e, "No se pudo guardar INTER."));
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-base">Actualización automática</CardTitle>
        <CardDescription>
          Obtiene referencia LBMA (Minted Metal) desde el servidor. La app móvil seguirá
          recibiendo estos valores desde la app móvil.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-2 text-sm md:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Estado</dt>
            <dd className="font-medium">{meta.statusLabel}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Fuente oro</dt>
            <dd>{meta.goldSource}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Fuente plata</dt>
            <dd>{meta.silverSource}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Última obtención oro</dt>
            <dd>{meta.goldFetchedAt ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Última obtención plata</dt>
            <dd>{meta.silverFetchedAt ?? "—"}</dd>
          </div>
        </dl>

        {meta.lastError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            Último error: {meta.lastError}
          </p>
        ) : null}

        {localSuccess ? (
          <p className="text-sm font-medium text-emerald-700">{localSuccess}</p>
        ) : null}
        {localError ? <p className="text-sm text-destructive">{localError}</p> : null}

        {canWrite ? (
          <Button type="button" disabled={busy} onClick={() => void onFetchPreview()}>
            {preview.isPending ? "Consultando mercado…" : "Actualizar INTER"}
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">
            Solo administradores pueden actualizar INTER desde la fuente externa.
          </p>
        )}
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirmar actualización de INTER"
        description={
          previewData ? (
            <span className="block space-y-3 text-left text-sm">
              <span className="block">{previewData.disclaimer}</span>
              <span className="block rounded-md border bg-muted/40 p-3">
                <strong>Oro (US$/oz):</strong> {settings.defaultInterGold ?? "—"} →{" "}
                {previewData.quote.goldUsPerOz}
                <br />
                <strong>Plata (US$/oz):</strong> {settings.defaultInterSilver ?? "—"} →{" "}
                {previewData.quote.silverUsPerOz}
                <br />
                <span className="text-muted-foreground">
                  Fuente: {previewData.quote.sourceLabel}
                  {previewData.quote.marketUpdatedAt
                    ? ` · Mercado: ${new Date(previewData.quote.marketUpdatedAt).toLocaleString("es-PE")}`
                    : null}
                </span>
              </span>
            </span>
          ) : (
            ""
          )
        }
        confirmLabel="Guardar en configuración maestra"
        loading={apply.isPending}
        onCancel={() => {
          setConfirmOpen(false);
          setPreviewData(null);
        }}
        onConfirm={() => void onConfirmApply()}
      />
    </Card>
  );
}
