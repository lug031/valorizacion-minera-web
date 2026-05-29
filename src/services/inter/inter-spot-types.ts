export type InterFetchStatus = "ok" | "failed" | "partial";

export interface InterSpotQuote {
  goldUsPerOz: string;
  silverUsPerOz: string;
  source: string;
  sourceLabel: string;
  providerFetchedAt: string;
  marketUpdatedAt: string | null;
}

export interface InterSpotPreviewResponse {
  quote: InterSpotQuote;
  disclaimer: string;
}
