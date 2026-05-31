"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFieldUser,
  listFieldUsers,
  resetFieldUserPassword,
  updateFieldUser,
} from "@/services/field-user.service";
import type {
  CreateFieldUserFormValues,
  UpdateFieldUserFormValues,
} from "@/features/field-users/schemas/field-user.schema";

const QUERY_KEY = ["field-users"];

export function useFieldUsers() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: listFieldUsers,
  });
}

export function useFieldUserMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  };

  const create = useMutation({
    mutationFn: (values: CreateFieldUserFormValues) => createFieldUser(values),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: UpdateFieldUserFormValues }) =>
      updateFieldUser(id, values),
    onSuccess: invalidate,
  });

  const resetPassword = useMutation({
    mutationFn: (id: string) => resetFieldUserPassword(id),
    onSuccess: invalidate,
  });

  return { create, update, resetPassword };
}
