"use client";

import { Button } from "@/components/ui/button";

interface LoadMoreFooterProps {
  hasMore: boolean;
  loading?: boolean;
  onLoadMore: () => void;
  shown: number;
  total?: number;
}

export function LoadMoreFooter({ hasMore, loading, onLoadMore, shown, total }: LoadMoreFooterProps) {
  if (!hasMore && shown === 0) return null;

  return (
    <div className="flex flex-col items-center gap-2 border-t border-[#e2e8f0] py-4">
      <p className="text-xs text-[#64748b]">
        Mostrando {shown}
        {typeof total === "number" ? ` de ${total}` : ""} registros
      </p>
      {hasMore ? (
        <Button type="button" variant="outline" size="sm" onClick={onLoadMore} disabled={loading}>
          {loading ? "Cargando…" : "Cargar más"}
        </Button>
      ) : null}
    </div>
  );
}
