"use client";

import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildEnrollmentInstructions,
  type EnrollmentCodeResult,
  type FieldDeviceRecord,
} from "@/features/field-devices/schemas/field-device.schema";

interface Props {
  open: boolean;
  device: FieldDeviceRecord | null;
  result: EnrollmentCodeResult | null;
  onClose: () => void;
}

function formatExpiry(value: string): string {
  try {
    return new Date(value).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return value;
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function EnrollmentCodeDialog({ open, device, result, onClose }: Props) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInstructions, setCopiedInstructions] = useState(false);

  if (!open || !device || !result) return null;

  const instructions = buildEnrollmentInstructions(device, result.enrollmentCode, result.expiresAt);

  const handleCopyCode = async () => {
    const ok = await copyText(result.enrollmentCode);
    setCopiedCode(ok);
    if (ok) setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyInstructions = async () => {
    const ok = await copyText(instructions);
    setCopiedInstructions(ok);
    if (ok) setTimeout(() => setCopiedInstructions(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border bg-background p-6 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-amber-100 p-2 text-amber-900">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Código de activación</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Para {device.fieldUserDisplayName ?? device.fieldUserUsername ?? "usuario de campo"}.
              Este código se muestra <strong>una sola vez</strong>.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-800">Código</p>
          <p className="mt-2 font-mono text-3xl font-semibold tracking-widest text-amber-950">
            {result.enrollmentCode}
          </p>
          <p className="mt-2 text-sm text-amber-900/80">
            Expira: {formatExpiry(result.expiresAt)} · un solo uso
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void handleCopyCode()}>
            {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copiedCode ? "Copiado" : "Copiar código"}
          </Button>
          <Button type="button" variant="outline" onClick={() => void handleCopyInstructions()}>
            {copiedInstructions ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copiedInstructions ? "Copiado" : "Copiar instrucciones"}
          </Button>
        </div>

        <div className="mt-4 rounded-md border bg-muted/40 p-3 text-sm">
          <p className="font-medium">Runbook operativo</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>Envíe el código al operador (WhatsApp, llamada, etc.).</li>
            <li>
              En la app: <strong>Activar dispositivo</strong> con username{" "}
              <strong>{device.fieldUserUsername ?? "—"}</strong>, su contraseña de campo y el código.
            </li>
            <li>Requiere internet solo en la activación; luego el login es offline.</li>
            <li>Si cambia de teléfono: revocar → asignar cupo → generar código nuevo.</li>
          </ol>
        </div>

        <pre className="mt-4 max-h-40 overflow-auto rounded-md border bg-muted/30 p-3 text-xs whitespace-pre-wrap">
          {instructions}
        </pre>

        <div className="mt-5 flex justify-end">
          <Button type="button" onClick={onClose}>
            Entendido
          </Button>
        </div>
      </div>
    </div>
  );
}
