"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStaffUser,
  listStaffUsers,
  updateStaffUser,
} from "@/services/staff-user.service";
import type {
  CreateStaffUserFormValues,
  UpdateStaffUserFormValues,
} from "@/features/users/schemas/staff-user.schema";

const QUERY_KEY = ["staff-users"];

export function useStaffUsers() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: listStaffUsers,
  });
}

export function useStaffUserMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ["dashboard-counts"] });
  };

  const create = useMutation({
    mutationFn: (values: CreateStaffUserFormValues) => createStaffUser(values),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: UpdateStaffUserFormValues }) =>
      updateStaffUser(id, values),
    onSuccess: invalidate,
  });

  return { create, update };
}
