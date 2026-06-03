"use client";

import { useMemo, useState } from "react";
import { Ban, KeyRound, Pencil, Plus, Smartphone, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoadMoreFooter } from "@/components/ui/load-more-footer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCanWriteAdmin } from "@/providers/auth-provider";
import { EnrollmentCodeDialog } from "@/features/field-devices/components/enrollment-code-dialog";
import { UsageExtensionCodeDialog } from "@/features/field-devices/components/usage-extension-code-dialog";
import { FieldDeviceFormDialog } from "@/features/field-devices/components/field-device-form-dialog";
import { useFieldDeviceMutations, useFieldDevices } from "@/features/field-devices/hooks/use-field-devices";
import { useFieldUsers } from "@/features/field-users/hooks/use-field-users";
import { fieldRoleLabel } from "@/features/field-users/schemas/field-user.schema";
import {
  fieldDeviceStatusLabel,
  maxDevicesForRole,
  usagePolicyLabel,
  type AssignFieldDeviceFormValues,
  type EnrollmentCodeResult,
  type FieldDeviceRecord,
  type UpdateFieldDeviceFormValues,
  type UsageExtensionCodeResult,
} from "@/features/field-devices/schemas/field-device.schema";
import { formatDateTimePet } from "@/lib/datetime/peru-local";
import { formatApiError } from "@/lib/errors/format-api-error";
import { LIST_PAGE_SIZE } from "@/lib/pagination/constants";

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return value;
  }
}

function activationCodeLabel(row: FieldDeviceRecord): string {
  if (row.status !== "pending") return "—";
  if (row.hasActiveActivationCode && row.activationExpiresAt) {
    return `Activo hasta ${formatDate(row.activationExpiresAt)}`;
  }
  return "Sin código";
}

export function FieldDevicesPageContent() {
  const canWrite = useCanWriteAdmin();
  const { data, isLoading, error } = useFieldDevices();
  const { data: fieldUsers } = useFieldUsers();
  const { assign, update, revoke, generateCode, generateUsageCode, resetUsageQuota } =
    useFieldDeviceMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"assign" | "edit">("assign");
  const [editing, setEditing] = useState<FieldDeviceRecord | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [assignNotice, setAssignNotice] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(LIST_PAGE_SIZE);
  const [revokeTarget, setRevokeTarget] = useState<FieldDeviceRecord | null>(null);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [codeDialogDevice, setCodeDialogDevice] = useState<FieldDeviceRecord | null>(null);
  const [codeDialogResult, setCodeDialogResult] = useState<EnrollmentCodeResult | null>(null);
  const [generatingDeviceId, setGeneratingDeviceId] = useState<string | null>(null);
  const [usageCodeDialogOpen, setUsageCodeDialogOpen] = useState(false);
  const [usageCodeDialogDevice, setUsageCodeDialogDevice] = useState<FieldDeviceRecord | null>(null);
  const [usageCodeDialogResult, setUsageCodeDialogResult] = useState<UsageExtensionCodeResult | null>(
    null
  );
  const [usageGeneratingId, setUsageGeneratingId] = useState<string | null>(null);

  const rows = useMemo(() => (data ?? []).slice(0, visibleCount), [data, visibleCount]);
  const totalRows = data?.length ?? 0;
  const hasMore = visibleCount < totalRows;

  const activeCountByUser = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      if (row.status === "pending" || row.status === "enrolled") {
        counts.set(row.fieldUserId, (counts.get(row.fieldUserId) ?? 0) + 1);
      }
    }
    return counts;
  }, [data]);

  const pendingWithoutCode = useMemo(
    () =>
      (data ?? []).filter((row) => row.status === "pending" && !row.hasActiveActivationCode).length,
    [data]
  );

  const openAssign = () => {
    setEditing(null);
    setDialogMode("assign");
    setReadOnly(false);
    setFormError(null);
    setAssignNotice(null);
    setDialogOpen(true);
  };

  const openEdit = (row: FieldDeviceRecord) => {
    setEditing(row);
    setDialogMode("edit");
    setReadOnly(!canWrite || row.status === "revoked");
    setFormError(null);
    setDialogOpen(true);
  };

  const handleAssign = async (values: AssignFieldDeviceFormValues) => {
    setFormError(null);
    setAssignNotice(null);
    try {
      const created = await assign.mutateAsync(values);
      setDialogOpen(false);
      setVisibleCount(LIST_PAGE_SIZE);
      setAssignNotice(
        `Teléfono reservado para ${created.fieldUserDisplayName ?? created.fieldUserUsername ?? "el usuario"}. Genere y envíe el código de activación.`
      );
    } catch (e) {
      setFormError(formatApiError(e, "No se pudo asignar el dispositivo."));
    }
  };

  const handleUpdate = async (values: UpdateFieldDeviceFormValues) => {
    if (!editing) return;
    setFormError(null);
    try {
      await update.mutateAsync({ id: editing.id, values });
      setDialogOpen(false);
    } catch (e) {
      setFormError(formatApiError(e, "No se pudo actualizar el dispositivo."));
    }
  };

  const handleGenerateCode = async (row: FieldDeviceRecord) => {
    setFormError(null);
    setGeneratingDeviceId(row.id);
    try {
      const result = await generateCode.mutateAsync(row.id);
      setCodeDialogDevice(row);
      setCodeDialogResult(result);
      setCodeDialogOpen(true);
    } catch (e) {
      setFormError(formatApiError(e, "No se pudo generar el código de activación."));
    } finally {
      setGeneratingDeviceId(null);
    }
  };

  const handleGenerateUsageCode = async (row: FieldDeviceRecord) => {
    setFormError(null);
    setUsageGeneratingId(row.id);
    try {
      const result = await generateUsageCode.mutateAsync(row.id);
      setUsageCodeDialogDevice(row);
      setUsageCodeDialogResult(result);
      setUsageCodeDialogOpen(true);
    } catch (e) {
      setFormError(formatApiError(e, "No se pudo generar el código de extensión."));
    } finally {
      setUsageGeneratingId(null);
    }
  };

  const handleResetUsageQuota = async (row: FieldDeviceRecord) => {
    setFormError(null);
    try {
      await resetUsageQuota.mutateAsync(row.id);
    } catch (e) {
      setFormError(formatApiError(e, "No se pudo reiniciar el cupo de uso."));
    }
  };

  const confirmRevoke = async (row: FieldDeviceRecord) => {
    setFormError(null);
    try {
      await revoke.mutateAsync(row.id);
      setRevokeTarget(null);
    } catch (e) {
      setFormError(formatApiError(e, "No se pudo retirar el teléfono."));
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 rounded-md border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
        <p className="font-medium">Autorizar teléfonos</p>
        <p className="mt-1 text-sky-900/90">
          Asigne un teléfono, genere un código y envíelo al operador. El código dura 72 horas y solo sirve
          una vez. Cada operador puede tener 1 teléfono; cada administrador móvil, hasta 2.
        </p>
      </div>

      {canWrite && pendingWithoutCode > 0 ? (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-medium">Teléfonos pendientes sin código</p>
          <p className="mt-1 text-amber-900/90">
            Hay {pendingWithoutCode} teléfono(s) pendientes de activación sin código. Genere un código para
            cada uno que deba usarse.
          </p>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Un código nuevo invalida el anterior. Si retira un teléfono, puede asignar otro y generar un código
          nuevo.
        </p>
        {canWrite ? (
          <Button onClick={openAssign}>
            <Plus className="h-4 w-4" />
            Asignar teléfono
          </Button>
        ) : null}
      </div>

      {formError ? <p className="mb-3 text-sm text-destructive">{formError}</p> : null}
      {assignNotice ? (
        <p className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          {assignNotice}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando dispositivos…</p>
      ) : error ? (
        <p className="text-sm text-destructive">
          {formatApiError(error, "No se pudo cargar el listado de dispositivos.")}
        </p>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario de campo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Modo</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Suspendido</TableHead>
                <TableHead>Válido hasta</TableHead>
                <TableHead>Última conexión</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                    <Smartphone className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    No hay teléfonos registrados.
                    {canWrite ? " Use «Asignar teléfono» para empezar." : ""}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const activeCount = activeCountByUser.get(row.fieldUserId) ?? 0;
                  const maxDevices = maxDevicesForRole(row.fieldUserRole);
                  const canGenerateCode =
                    canWrite && row.status === "pending" && !row.isBlocked;
                  const isTrial = row.usagePolicy === "trial";
                  const canUsageExtension =
                    canWrite && isTrial && row.status === "enrolled" && !row.isBlocked;
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        <div>{row.fieldUserDisplayName ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.fieldUserUsername ?? row.fieldUserId}
                        </div>
                        {row.deviceLabel ? (
                          <div className="mt-1 text-xs text-muted-foreground">{row.deviceLabel}</div>
                        ) : null}
                        {row.status !== "revoked" ? (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Teléfonos: {activeCount}/{maxDevices}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>{fieldRoleLabel(row.fieldUserRole)}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            row.status === "enrolled"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : row.status === "pending"
                                ? "border-amber-200 bg-amber-50 text-amber-900"
                                : "border-slate-200 bg-slate-50 text-slate-600"
                          }
                        >
                          {fieldDeviceStatusLabel(row.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge
                          className={
                            isTrial
                              ? "border-violet-200 bg-violet-50 text-violet-900"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                          }
                        >
                          {usagePolicyLabel(row.usagePolicy)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {row.status === "pending" ? (
                          row.hasActiveActivationCode ? (
                            <Badge className="border-sky-200 bg-sky-50 text-sky-900">
                              {activationCodeLabel(row)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">Sin código</span>
                          )
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.isBlocked ? (
                          <Badge className="border-red-200 bg-red-50 text-red-800">Sí</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTimePet(row.validUntil)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(row.lastSeenAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {canGenerateCode ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={generatingDeviceId === row.id || generateCode.isPending}
                              onClick={() => void handleGenerateCode(row)}
                            >
                              <KeyRound className="h-4 w-4" />
                              {row.hasActiveActivationCode ? "Regenerar código" : "Generar código"}
                            </Button>
                          ) : null}
                          {canUsageExtension ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={usageGeneratingId === row.id || generateUsageCode.isPending}
                                onClick={() => void handleGenerateUsageCode(row)}
                              >
                                <Timer className="h-4 w-4" />
                                Código 2 h
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={resetUsageQuota.isPending}
                                onClick={() => void handleResetUsageQuota(row)}
                              >
                                Reiniciar cupo
                              </Button>
                            </>
                          ) : null}
                          <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                            <Pencil className="h-4 w-4" />
                            {canWrite && row.status !== "revoked" ? "Editar" : "Ver"}
                          </Button>
                          {canWrite && row.status !== "revoked" ? (
                            <Button variant="ghost" size="sm" onClick={() => setRevokeTarget(row)}>
                              <Ban className="h-4 w-4" />
                              Retirar
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <LoadMoreFooter
            hasMore={hasMore}
            onLoadMore={() => setVisibleCount((c) => c + LIST_PAGE_SIZE)}
            shown={rows.length}
            total={totalRows}
          />
        </div>
      )}

      <FieldDeviceFormDialog
        open={dialogOpen}
        mode={dialogMode}
        initial={editing}
        fieldUsers={fieldUsers ?? []}
        readOnly={readOnly}
        saving={assign.isPending || update.isPending}
        onClose={() => setDialogOpen(false)}
        onSubmitAssign={(values) => void handleAssign(values)}
        onSubmitUpdate={(values) => void handleUpdate(values)}
      />

      <EnrollmentCodeDialog
        open={codeDialogOpen}
        device={codeDialogDevice}
        result={codeDialogResult}
        onClose={() => {
          setCodeDialogOpen(false);
          setCodeDialogDevice(null);
          setCodeDialogResult(null);
        }}
      />

      <UsageExtensionCodeDialog
        open={usageCodeDialogOpen}
        device={usageCodeDialogDevice}
        result={usageCodeDialogResult}
        onClose={() => {
          setUsageCodeDialogOpen(false);
          setUsageCodeDialogDevice(null);
          setUsageCodeDialogResult(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        title="Retirar teléfono"
        description={`¿Confirma retirar el teléfono de ${revokeTarget?.fieldUserDisplayName ?? revokeTarget?.fieldUserUsername ?? "este usuario"}? Se anularán los códigos pendientes.`}
        confirmLabel="Retirar"
        destructive
        loading={revoke.isPending}
        onCancel={() => setRevokeTarget(null)}
        onConfirm={() => {
          if (revokeTarget) void confirmRevoke(revokeTarget);
        }}
      />
    </div>
  );
}
