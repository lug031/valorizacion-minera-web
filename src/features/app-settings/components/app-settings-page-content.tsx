"use client";

import { AppSettingsForm } from "@/features/app-settings/components/app-settings-form";
import { useMasterAppSettings } from "@/features/app-settings/hooks/use-app-settings";

export function AppSettingsPageContent() {
  const { data, isLoading, error } = useMasterAppSettings();

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Cargando configuración comercial…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "No se pudo cargar la configuración"}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <p className="mb-6 text-sm text-muted-foreground">
        Parámetros globales del negocio. Estos valores serán la fuente maestra para futura sincronización con la
        app móvil.
      </p>
      <AppSettingsForm settings={data} />
    </div>
  );
}
