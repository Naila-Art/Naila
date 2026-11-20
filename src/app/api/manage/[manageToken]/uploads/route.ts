import { NextResponse } from "next/server";
import { bad, manageContext, readJson } from "@/lib/api";
import { eventContext } from "@/lib/event-context";
import { UPLOAD_RULES, createUploadUrl, objectKeyFor } from "@/lib/storage";

type Ctx = { params: Promise<{ manageToken: string }> };

/** Upload slot for the client: their own song (custom-music add-on) or the Instapay screenshot. */
export async function POST(req: Request, ctx: Ctx) {
  const found = await manageContext((await ctx.params).manageToken);
  if (!found?.order) return bad("not_found", 404);
  const { event, order } = found;
  const body = await readJson(req);
  const kind = body?.kind;
  if (kind !== "music" && kind !== "proof") return bad("invalid_kind");

  if (kind === "music" && (!order.addons.customMusic || !(await eventContext(event)).features.music)) {
    return bad("not_included", 403);
  }
  if (kind === "proof" && order.payment === "paid") return bad("already_paid", 409);

  const rules = UPLOAD_RULES[kind];
  const contentType = String(body?.contentType ?? "");
  if (!(contentType in rules.types)) return bad(`${kind}_wrong_type`);
  const size = Number(body?.size);
  if (!Number.isFinite(size) || size <= 0) return bad("invalid_size");
  if (size > rules.maxBytes) return bad(`${kind}_too_large`);

  const owner = kind === "music" ? `events/${event.id}` : `payments/${order.id}`;
  const objectKey = objectKeyFor(owner, kind, contentType);
  return NextResponse.json({ objectKey, uploadUrl: await createUploadUrl(objectKey, contentType) });
}
