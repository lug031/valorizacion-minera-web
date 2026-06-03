"use client";

import { useState } from "react";
import { Check, Copy, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildUsageExtensionInstructions,
  type FieldDeviceRecord,
  type UsageExtensionCodeResult,
} from "@/features/field-devices/schemas/field-device.schema";

interface Props {
  open: boolean;
  device: FieldDeviceRecord | null;
  result: UsageExtensionCodeResult | null;
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

export function UsageExtensionCodeDialog({ open, device, result, onClose }: Props) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInstructions, setCopiedInstructions] = useState(false);

  if (!open || !device || !result) return null;

  const instructions = buildUsageExtensionInstructions(
    device,
    result.extensionCode,
    result.expiresAt,
    result.grantMinutes
  );
  const displayName = device.fieldUserDisplayName ?? device.fieldUserUsername ?? "el operador";

  const handleCopyCode = async () => {
    const ok = await copyText(result.extensionCode);
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
          <Timer className="mt-0.5 h-6 w-6 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Código de extensión de uso</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Para {displayName}. Reinicia el cupo de {result.grantMinutes} minutos en modo prueba.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-md border bg-muted/40 p-4 text-center">
          <p className="text-xs text-muted-foreground">Código (un solo uso)</p>
          <p className="mt-2 font-mono text-2xl font-bold tracking-widest">{result.extensionCode}</p>
          <p className="mt-2 text-xs text-muted-foreground">Válido hasta {formatExpiry(result.expiresAt)}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void handleCopyCode()}>
            {copiedCode ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
            Copiar código
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void handleCopyInstructions()}>
            {copiedInstructions ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
            Copiar instrucciones
          </Button>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="button" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
