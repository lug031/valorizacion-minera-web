import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMasterAppSettings,
  restoreReferenceAppSettings,
  updateMasterAppSettings,
} from "@/services/app-settings.service";
import type { AppSettingsFormValues } from "@/features/app-settings/schemas/app-settings.schema";

const QUERY_KEY = ["app-settings", "master"];

export function useMasterAppSettings() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getMasterAppSettings,
  });
}

export function useAppSettingsMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const update = useMutation({
    mutationFn: (values: AppSettingsFormValues) => updateMasterAppSettings(values),
    onSuccess: invalidate,
  });

  const restoreReference = useMutation({
    mutationFn: restoreReferenceAppSettings,
    onSuccess: invalidate,
  });

  return { update, restoreReference };
}
