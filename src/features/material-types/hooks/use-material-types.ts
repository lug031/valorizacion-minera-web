"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMaterialType,
  deleteMaterialType,
  listMaterialTypes,
  setMaterialTypeActive,
  updateMaterialType,
} from "@/services/material-type.service";
import type { MaterialTypeFormValues } from "@/features/material-types/schemas/material-type.schema";

const QUERY_KEY = ["material-types"];

export function useMaterialTypes() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: listMaterialTypes,
  });
}

export function useMaterialTypeMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const create = useMutation({
    mutationFn: (values: MaterialTypeFormValues) => createMaterialType(values),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: MaterialTypeFormValues }) =>
      updateMaterialType(id, values),
    onSuccess: invalidate,
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setMaterialTypeActive(id, isActive),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteMaterialType(id),
    onSuccess: invalidate,
  });

  return { create, update, toggleActive, remove };
}
