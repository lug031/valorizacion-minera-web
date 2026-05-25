"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { ResourcesConfig } from "aws-amplify";
import { configureAmplify } from "@/lib/amplify/configure";

type OutputsModule = { default: ResourcesConfig };

export function AmplifyProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [missingConfig, setMissingConfig] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const mod = (await import("../../amplify_outputs.json")) as OutputsModule;
        configureAmplify(mod.default);
        setReady(true);
      } catch {
        setMissingConfig(true);
        setReady(true);
      }
    })();
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Inicializando…
      </div>
    );
  }

  if (missingConfig) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-lg rounded-lg border bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-primary">Configuración Amplify pendiente</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ejecute <code className="rounded bg-muted px-1">npm run sandbox</code> en este proyecto
            para generar <code className="rounded bg-muted px-1">amplify_outputs.json</code> y
            conectar Cognito + AppSync.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
