"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAuthSession } from "aws-amplify/auth";
import {
  applyInterSpotQuote,
  recordInterFetchFailure,
} from "@/services/app-settings.service";
import type { InterSpotPreviewResponse } from "@/services/inter/inter-spot-types";
import { formatApiError } from "@/lib/errors/format-api-error";

const QUERY_KEY = ["app-settings", "master"];

async function fetchInterPreview(): Promise<InterSpotPreviewResponse> {
  const session = await fetchAuthSession();
  const token = session.tokens?.accessToken?.toString();
  if (!token) {
    throw new Error("Sesión no disponible. Vuelva a iniciar sesión.");
  }

  const response = await fetch("/api/inter/preview", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const body = (await response.json()) as InterSpotPreviewResponse & { error?: string };
  if (!response.ok) {
    throw new Error(body.error ?? "No se pudo obtener la vista previa de INTER");
  }

  return body;
}

export function useInterSpotUpdate() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ["dashboard-counts"] });
  };

  const preview = useMutation({
    mutationFn: fetchInterPreview,
    onError: async (error) => {
      try {
        await recordInterFetchFailure(formatApiError(error, "Error al obtener INTER"));
        invalidate();
      } catch {
        /* conservar valores vigentes aunque falle el registro de error */
      }
    },
  });

  const apply = useMutation({
    mutationFn: applyInterSpotQuote,
    onSuccess: invalidate,
  });

  return { preview, apply };
}
