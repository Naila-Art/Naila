import { NextResponse } from "next/server";
import { bad, manageContext, readJson } from "@/lib/api";
import { eventContext, parseEventDetails } from "@/lib/event-context";
import { findTemplate, getMusic, updateEventDetails } from "@/lib/store";

type Ctx = { params: Promise<{ manageToken: string }> };

/** Edit names, date, venue, map link, language, template and library track. */
export async function PUT(req: Request, ctx: Ctx) {
  const found = await manageContext((await ctx.params).manageToken);
  if (!found) return bad("not_found", 404);
  const { event } = found;
  const body = await readJson(req);
  if (!body) return bad("invalid_body");

  const details = parseEventDetails(body);
  if (!details.ok) return bad(details.error);
  const { features } = await eventContext(event);

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
  return NextResponse.json({ event: updated });
}
