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
  const displayName = device.fieldUserDisplayName ?? device.fieldUserUsername ?? "el operador";

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
              Para {displayName}. Envíelo al operador; solo se muestra una vez.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-800">Código</p>
          <p className="mt-2 font-mono text-3xl font-semibold tracking-widest text-amber-950">
            {result.enrollmentCode}
          </p>
          <p className="mt-2 text-sm text-amber-900/80">
            Válido hasta {formatExpiry(result.expiresAt)}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void handleCopyCode()}>
            {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copiedCode ? "Copiado" : "Copiar código"}
          </Button>
          <Button type="button" variant="outline" onClick={() => void handleCopyInstructions()}>
            {copiedInstructions ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copiedInstructions ? "Copiado" : "Copiar mensaje para enviar"}
          </Button>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          El operador debe abrir <strong>Activar dispositivo</strong> en la app e ingresar su usuario,
          contraseña y este código. Si expira, genere uno nuevo.
        </p>

        <div className="mt-5 flex justify-end">
          <Button type="button" onClick={onClose}>
            Entendido
          </Button>
        </div>
      </div>
    </div>
  );
}
