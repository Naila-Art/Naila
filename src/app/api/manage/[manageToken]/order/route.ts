import { NextResponse } from "next/server";
import { bad, manageContext, readJson } from "@/lib/api";
import { getPackage, isSelfServe, namesLimitOf, parseAddons, priceOf } from "@/lib/pricing";
import { getPricing, updateEventDetails, updateOrder } from "@/lib/store";
import type { PackageId } from "@/lib/types";

type Ctx = { params: Promise<{ manageToken: string }> };

/** Change package / add-ons before paying. Body: { packageId, addons }. */
export async function PUT(req: Request, ctx: Ctx) {
  const found = await manageContext((await ctx.params).manageToken);
  if (!found?.order) return bad("not_found", 404);
  const { event, order } = found;
  if (order.payment !== "unpaid") return bad("already_paid", 409);

  const body = await readJson(req);
  const packageId = Number(body?.packageId) as PackageId;
  const pricing = await getPricing();
  const pkg = getPackage(pricing, packageId);
  if (!pkg || !isSelfServe(packageId)) return bad("invalid_package");
  // A package taken off sale can be kept by an order that already has it, but not switched to.
  if (!pkg.active && packageId !== order.packageId) return bad("invalid_package");
  const addons = parseAddons(body?.addons);
  addons.arabic = event.lang === "ar";

  // Drop what the new choice no longer covers.
  if (!addons.maps && event.mapsUrl) await updateEventDetails(event.id, { mapsUrl: undefined });
  if (packageId < 2 && event.musicTrackId) await updateEventDetails(event.id, { musicTrackId: undefined });

  const updated = await updateOrder(order.id, {
    packageId,
    addons,
    total: priceOf(pricing, packageId, addons),
    namesLimit: namesLimitOf(pricing, packageId, addons),
  });
  return NextResponse.json({ order: updated });
}
