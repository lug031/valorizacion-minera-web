import { NextResponse } from "next/server";
import { verifyAdminBearer } from "@/lib/auth/verify-admin-bearer";
import {
  fetchInterSpotFromProvider,
  INTER_SPOT_PREVIEW_DISCLAIMER,
} from "@/services/inter/inter-spot-provider";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await verifyAdminBearer(request.headers.get("authorization"));
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason }, { status: 401 });
  }

  try {
    const quote = await fetchInterSpotFromProvider();
    return NextResponse.json({
      quote,
      disclaimer: INTER_SPOT_PREVIEW_DISCLAIMER,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo obtener precios internacionales";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
