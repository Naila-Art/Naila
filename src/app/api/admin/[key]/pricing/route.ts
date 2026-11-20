import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { bad, readJson } from "@/lib/api";
import { parsePricing } from "@/lib/pricing";
import { getPricing, savePricing } from "@/lib/store";

type Ctx = { params: Promise<{ key: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  if (!isAdmin((await ctx.params).key)) return bad("not_found", 404);
  return NextResponse.json({ pricing: await getPricing() });
}

/**
 * Saves packages, add-on prices and guest-count tiers. Applies to new orders and to unpaid
 * orders when the client next changes their package; existing totals stay as they were.
 */
export async function PUT(req: Request, ctx: Ctx) {
  if (!isAdmin((await ctx.params).key)) return bad("not_found", 404);
  const parsed = parsePricing((await readJson(req))?.pricing);
  if (!parsed.ok) return bad(parsed.error);
  return NextResponse.json({ pricing: await savePricing(parsed.value) });
}
