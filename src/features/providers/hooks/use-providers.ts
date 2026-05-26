"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createProvider,
  listProvidersPage,
  setProviderActive,
  updateProvider,
} from "@/services/provider.service";
import type { ProviderFormValues } from "@/features/providers/schemas/provider.schema";

const QUERY_KEY = ["providers"];

export function useProviders() {
  return useInfiniteQuery({
    queryKey: QUERY_KEY,
    queryFn: ({ pageParam }) => listProvidersPage(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextToken,
  });
}

export function useProviderMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ["dashboard-counts"] });
  };

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
