import { NextResponse } from "next/server";
import { bad, manageContext, readJson } from "@/lib/api";
import { deleteObject, keyFromPublicUrl, kindOfKey, publicUrl, verifyUpload } from "@/lib/storage";
import { updateEventDetails } from "@/lib/store";

type Ctx = { params: Promise<{ manageToken: string }> };

/** Saves the client's own song after it was uploaded. Body: { objectKey } or { remove: true }. */
export async function PUT(req: Request, ctx: Ctx) {
  const found = await manageContext((await ctx.params).manageToken);
  if (!found?.order) return bad("not_found", 404);
  const { event, order } = found;
  if (!order.addons.customMusic) return bad("not_included", 403);
  const body = await readJson(req);

  const oldKey = event.musicUrl ? keyFromPublicUrl(event.musicUrl) : null;
  if (body?.remove === true) {
    await updateEventDetails(event.id, { musicUrl: undefined });
    if (oldKey) await deleteObject(oldKey);
    return NextResponse.json({ musicUrl: null });
  }

  const objectKey = String(body?.objectKey ?? "");
  if (kindOfKey(objectKey) !== "music" || !objectKey.startsWith(`events/${event.id}/`)) return bad("invalid_key");
  const check = await verifyUpload(objectKey, "music");
  if (check !== "ok") {
    await deleteObject(objectKey);
    return bad(check === "missing" ? "upload_missing" : check === "too_large" ? "music_too_large" : "music_wrong_type");
  }
  const musicUrl = publicUrl(objectKey);
  await updateEventDetails(event.id, { musicUrl });
  if (oldKey && oldKey !== objectKey) await deleteObject(oldKey);
  return NextResponse.json({ musicUrl });
}
