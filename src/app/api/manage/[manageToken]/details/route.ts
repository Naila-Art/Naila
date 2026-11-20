import { NextResponse } from "next/server";
import { bad, manageContext, readJson } from "@/lib/api";
import { eventContext, parseEventDetails } from "@/lib/event-context";
import { priceOf, sanitizeAddons } from "@/lib/pricing";
import { findTemplate, getMusic, getPricing, updateEventDetails, updateOrder } from "@/lib/store";

type Ctx = { params: Promise<{ manageToken: string }> };

/** Edit names, date, venue, map link, language, template and library track. */
export async function PUT(req: Request, ctx: Ctx) {
  const found = await manageContext((await ctx.params).manageToken);
  if (!found) return bad("not_found", 404);
  const { event, order } = found;
  const body = await readJson(req);
  if (!body) return bad("invalid_body");

  const details = parseEventDetails(body);
  if (!details.ok) return bad(details.error);
  const { features } = await eventContext(event);

  // After payment the language is fixed (Arabic is a paid add-on).
  if (order && order.payment !== "unpaid" && details.value.lang !== event.lang) return bad("lang_locked", 409);

  let templateId = event.templateId;
  if (typeof body.templateId === "string" && body.templateId !== event.templateId) {
    const t = await findTemplate(body.templateId);
    if (!t) return bad("invalid_template");
    templateId = t.id;
  }

  let musicTrackId = event.musicTrackId;
  if (body.musicTrackId !== undefined) {
    if (body.musicTrackId === "" || body.musicTrackId === null) musicTrackId = undefined;
    else if (typeof body.musicTrackId === "string" && features.music && (await getMusic(body.musicTrackId)))
      musicTrackId = body.musicTrackId;
    else return bad("invalid_music");
  }

  const updated = await updateEventDetails(event.id, {
    ...details.value,
    mapsUrl: features.maps ? details.value.mapsUrl : undefined,
    templateId,
    musicTrackId,
  });
  // Switching language before paying changes the Arabic add-on and the price.
  if (order && order.payment === "unpaid" && details.value.lang !== event.lang) {
    const pricing = await getPricing();
    const addons = sanitizeAddons(pricing, order.addons, details.value.lang);
    await updateOrder(order.id, { addons, total: priceOf(pricing, order.packageId, addons) });
  }
  return NextResponse.json({ event: updated });
}
