"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMaquilaRange,
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

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

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

  return { create, update, toggleActive };
}
