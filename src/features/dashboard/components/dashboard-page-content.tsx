"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { AdminHeader, AdminShell } from "@/components/admin/admin-shell";
import { useDashboardCounts } from "@/features/dashboard/hooks/use-dashboard-counts";
import { formatDashboardCount } from "@/services/dashboard.service";
import { formatApiError } from "@/lib/errors/format-api-error";
import { cn } from "@/lib/utils";

type DashboardModule = {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  gradient: string;
  countKey?: keyof import("@/services/dashboard.service").DashboardCounts;
  staticCount?: string;
  actionVariant?: "red" | "teal";
  decor: React.ReactNode;
};

const DASHBOARD_MODULES: DashboardModule[] = [
  {
    title: "Rangos maquila",
    description: "Tabla maestra para sugerencias comerciales según ley oro (oz/tc).",
    href: "/admin/maquila",
    actionLabel: "Administrar rangos",
    countKey: "maquilaRanges",
    gradient: "bg-gradient-to-br from-[#0092B0] to-[#00748F]",
    decor: (
      <svg fill="currentColor" height="100" viewBox="0 0 100 100" width="100">
        <path d="M50 0 L100 50 L50 100 L0 50 Z" />
      </svg>
    ),
  },
  {
    title: "Defaults comerciales",
    description: "Factor, REC, RC, consumos, flete e INTER internacional del cotizador.",
    href: "/admin/configuracion",
    actionLabel: "Administrar defaults",
    staticCount: "1",
    gradient: "bg-gradient-to-br from-[#007581] to-[#005F6A]",
    decor: (
      <svg fill="currentColor" height="100" viewBox="0 0 100 100" width="100">
        <circle cx="50" cy="50" r="50" />
      </svg>
    ),
  },
  {
    title: "Tipos MAT",
    description: "Catálogo maestro de clasificación de material (MSC, MOC, MSLL, etc.).",
    href: "/admin/materiales",
    actionLabel: "Administrar tipos MAT",
    countKey: "materialTypes",
    gradient: "bg-gradient-to-br from-[#0092B0] to-[#006888]",
    decor: (
      <svg fill="currentColor" height="100" viewBox="0 0 100 100" width="100">
        <rect height="80" rx="8" width="80" x="10" y="10" />
      </svg>
    ),
  },
  {
    title: "Proveedores",
    description: "Catálogo de contrapartes comerciales y parámetros por proveedor.",
    href: "/admin/proveedores",
    actionLabel: "Administrar proveedores",
    countKey: "providers",
    gradient: "bg-gradient-to-br from-[#007581] to-[#004E56]",
    decor: (
      <svg fill="currentColor" height="100" viewBox="0 0 100 100" width="100">
        <path d="M20 80 L50 20 L80 80 Z" />
      </svg>
    ),
  },
  {
    title: "Usuarios",
    description: "Usuarios web y usuarios móvil.",
    href: "/admin/usuarios",
    actionLabel: "Administrar usuarios",
    countKey: "staffUsers",
    gradient: "bg-gradient-to-br from-[#7B2E78] to-[#5D235B]",
    decor: (
      <svg fill="currentColor" height="80" viewBox="0 0 80 80" width="80">
        <path d="M40 0 C62.09 0 80 17.91 80 40 C80 62.09 62.09 80 40 80 C17.91 80 0 62.09 0 40 C0 17.91 17.91 0 40 0 M40 20 C28.95 20 20 28.95 20 40 C20 51.05 28.95 60 40 60 C51.05 60 60 51.05 60 40 C60 28.95 51.05 20 40 20 Z" />
      </svg>
    ),
  },
  {
    title: "Valorizaciones",
    description: "Consulta de cotizaciones registradas y detalle de cada operación.",
    href: "/admin/valorizaciones",
    actionLabel: "Consultar valorizaciones",
    countKey: "valuations",
    gradient: "bg-gradient-to-br from-[#008ba3] to-[#005a68]",
    actionVariant: "teal",
    decor: (
      <svg fill="currentColor" height="100" viewBox="0 0 100 100" width="100">
        <path d="M10 70 L30 30 L55 55 L90 15 L90 85 L10 85 Z" />
      </svg>
    ),
  },
];

function ModuleStatCard({
  title,
  description,
  count,
  gradient,
  actionHref,
  actionLabel,
  actionVariant = "red",
  decor,
}: {
  title: string;
  description: string;
  count: string;
  gradient: string;
  actionHref: string;
  actionLabel: string;
  actionVariant?: "red" | "teal";
  decor: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-[8.5rem] flex-col justify-between overflow-hidden rounded-2xl p-6 text-white shadow-sm",
        gradient
      )}
    >
      <div className="pointer-events-none absolute -bottom-6 -left-6 -rotate-12 opacity-20">{decor}</div>
      <div className="relative z-[1]">
        <div className="text-3xl font-extrabold tabular-nums">{count}</div>
        <div className="mt-1 text-sm font-bold">{title}</div>
        <p className="mt-2 line-clamp-2 text-xs font-medium leading-snug text-white/90">{description}</p>
      </div>
      <div className="relative z-[1] mt-4 flex justify-end">
        <Link
          href={actionHref}
          className={cn(
            "rounded-full px-4 py-1.5 text-[10px] font-bold text-white transition-colors",
            actionVariant === "red" ? "bg-[#e31b5d] hover:bg-red-700" : "bg-[#008ba3] hover:bg-teal-700"
          )}
        >
          {actionLabel}
        </Link>
      </div>
    </div>
  );
}

export function DashboardPageContent() {
  const [search, setSearch] = useState("");
  const { data: counts, isLoading: countsLoading, error: countsError } = useDashboardCounts();

  const filteredModules = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return DASHBOARD_MODULES;
    return DASHBOARD_MODULES.filter(
      (item) =>
        item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
    );
  }, [search]);

  const resolveCount = (item: DashboardModule): string => {
    if (item.staticCount) return item.staticCount;
    if (!item.countKey || !counts) return countsLoading ? "…" : "0";
    return formatDashboardCount(counts[item.countKey]);
  };

  return (
    <AdminShell>
      <AdminHeader title="Dashboard" />
      <div className="space-y-6 p-8">
        {countsError ? (
          <p className="text-sm text-amber-800">
            {formatApiError(countsError, "No se pudieron cargar los totales del panel.")}
          </p>
        ) : null}

        <div className="flex justify-end">
          <div className="relative w-full max-w-sm">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-[#64748b]" />
            </span>
            <input
              className="block w-full rounded-lg border-none bg-gray-200 py-2 pl-10 pr-3 text-sm text-[#001c23] placeholder:text-[#64748b] focus:ring-2 focus:ring-[#008ba3]"
              placeholder="Buscar módulo"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filteredModules.length === 0 ? (
          <p className="text-center text-sm text-[#64748b]">No hay módulos que coincidan con la búsqueda.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredModules.map((item) => (
              <ModuleStatCard
                key={item.href}
                title={item.title}
                description={item.description}
                count={resolveCount(item)}
                gradient={item.gradient}
                actionHref={item.href}
                actionLabel={item.actionLabel}
                actionVariant={item.actionVariant}
                decor={item.decor}
              />
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
