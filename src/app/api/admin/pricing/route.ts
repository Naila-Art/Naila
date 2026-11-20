import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { bad, readJson } from "@/lib/api";
import { parsePricing } from "@/lib/pricing";
import { getPricing, savePricing } from "@/lib/store";

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;
  return NextResponse.json({ pricing: await getPricing() });
}

/**
 * Saves packages, add-on prices and guest-count tiers. Applies to new orders and to unpaid
 * orders when the client next changes their package; existing totals stay as they were.
 */
export async function PUT(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;
  const parsed = parsePricing((await readJson(req))?.pricing);
  if (!parsed.ok) return bad(parsed.error);
  return NextResponse.json({ pricing: await savePricing(parsed.value) });
}
