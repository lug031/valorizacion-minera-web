"use client";

import { useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FieldUserPasswordNoticeData {
  username: string;
  password: string;
  kind: "created" | "reset";
}

interface Props {
  data: FieldUserPasswordNoticeData;
  onDismiss: () => void;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function FieldUserPasswordNotice({ data, onDismiss }: Props) {
  const [copied, setCopied] = useState(false);

  const title = data.kind === "created" ? "Usuario creado" : "Contraseña restablecida";

  const handleCopy = async () => {
    const ok = await copyText(data.password);
    setCopied(ok);
    if (ok) setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-amber-900/90">
            Usuario <strong>{data.username}</strong>. Guarde la contraseña y compártala de forma segura.
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={onDismiss}>
          <X className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <code className="rounded border border-amber-200 bg-white px-3 py-2 font-mono text-base tracking-wide text-amber-950">
          {data.password}
        </code>
        <Button type="button" variant="outline" size="sm" onClick={() => void handleCopy()}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copiado" : "Copiar contraseña"}
        </Button>
      </div>
    </div>
  );
}
