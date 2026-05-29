import {
  INTER_SPOT_FETCH_TIMEOUT_MS,
  INTER_SPOT_PROVIDER_ID,
  INTER_SPOT_PROVIDER_LABEL,
} from "@/config/inter-spot";
import type { InterSpotQuote } from "@/services/inter/inter-spot-types";

const MINTED_METAL_PRICES_URL = "https://mintedmetal.com/api/prices.json";

function formatInterPrice(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Precio inválido: ${value}`);
  }
  return value.toFixed(2);
}

interface MintedMetalPricesJson {
  updatedAt?: string;
  metals?: {
    gold?: { price?: number };
    silver?: { price?: number };
  };
}

export async function fetchInterSpotFromProvider(): Promise<InterSpotQuote> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), INTER_SPOT_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(MINTED_METAL_PRICES_URL, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`Proveedor respondió HTTP ${response.status}`);
    }

    const body = (await response.json()) as MintedMetalPricesJson;
    const gold = body.metals?.gold?.price;
    const silver = body.metals?.silver?.price;

    if (gold == null || silver == null) {
      throw new Error("La respuesta del proveedor no incluye oro y plata");
    }

    const providerFetchedAt = new Date().toISOString();

    return {
      goldUsPerOz: formatInterPrice(gold),
      silverUsPerOz: formatInterPrice(silver),
      source: INTER_SPOT_PROVIDER_ID,
      sourceLabel: INTER_SPOT_PROVIDER_LABEL,
      providerFetchedAt,
      marketUpdatedAt: body.updatedAt ?? null,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Tiempo de espera agotado al consultar precios internacionales");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const INTER_SPOT_PREVIEW_DISCLAIMER =
  "Referencia LBMA vía Minted Metal. Puede diferir del valor que copian manualmente desde Kitco / Gold Live. Revise antes de guardar.";
