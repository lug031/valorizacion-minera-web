"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMaquilaRange,
  deleteMaquilaRange,
  listMaquilaRanges,
  setMaquilaRangeActive,
  updateMaquilaRange,
} from "@/services/maquila-range.service";
import type { MaquilaRangeFormValues } from "@/features/maquila/schemas/maquila-range.schema";

const QUERY_KEY = ["maquila-ranges"];

export function useMaquilaRanges() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: listMaquilaRanges,
  });
}

export function useMaquilaRangeMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ["dashboard-counts"] });
  };

  const create = useMutation({
    mutationFn: (values: MaquilaRangeFormValues) => createMaquilaRange(values),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: MaquilaRangeFormValues }) =>
      updateMaquilaRange(id, values),
    onSuccess: invalidate,
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setMaquilaRangeActive(id, isActive),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteMaquilaRange(id),
    onSuccess: invalidate,
  });

  return { create, update, toggleActive, remove };
}
