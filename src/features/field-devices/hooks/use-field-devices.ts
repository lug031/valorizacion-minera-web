"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignFieldDevice,
  generateFieldDeviceEnrollmentCode,
  generateUsageExtensionCode,
  listFieldDevices,
  revokeFieldDevice,
  updateFieldDevice,
} from "@/services/field-device.service";
import type {
  AssignFieldDeviceFormValues,
  UpdateFieldDeviceFormValues,
} from "@/features/field-devices/schemas/field-device.schema";

const QUERY_KEY = ["field-devices"];

export function useFieldDevices() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: listFieldDevices,
  });
}

export function useFieldDeviceMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  };

  const assign = useMutation({
    mutationFn: (values: AssignFieldDeviceFormValues) => assignFieldDevice(values),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: UpdateFieldDeviceFormValues }) =>
      updateFieldDevice(id, values),
    onSuccess: invalidate,
  });

  const revoke = useMutation({
    mutationFn: (id: string) => revokeFieldDevice(id),
    onSuccess: invalidate,
  });

  const generateCode = useMutation({
    mutationFn: (fieldDeviceId: string) => generateFieldDeviceEnrollmentCode(fieldDeviceId),
    onSuccess: invalidate,
  });

  const generateUsageCode = useMutation({
    mutationFn: (fieldDeviceId: string) => generateUsageExtensionCode(fieldDeviceId),
    onSuccess: invalidate,
  });

  return { assign, update, revoke, generateCode, generateUsageCode };
}
