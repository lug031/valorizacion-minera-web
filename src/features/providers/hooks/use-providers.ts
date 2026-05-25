"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProvider,
  listProviders,
  setProviderActive,
  updateProvider,
} from "@/services/provider.service";
import type { ProviderFormValues } from "@/features/providers/schemas/provider.schema";

const QUERY_KEY = ["providers"];

export function useProviders() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: listProviders,
  });
}

export function useProviderMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const create = useMutation({
    mutationFn: (values: ProviderFormValues) => createProvider(values),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ProviderFormValues }) =>
      updateProvider(id, values),
    onSuccess: invalidate,
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setProviderActive(id, isActive),
    onSuccess: invalidate,
  });

  return { create, update, toggleActive };
}
