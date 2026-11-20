import { NextResponse } from "next/server";
import { bad, cleanText, MAX_NAME, MAX_WISH, readJson, resolve } from "@/lib/api";
import { addWish } from "@/lib/store";
import { eventContext } from "@/lib/event-context";
import { displayName } from "@/lib/text";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await readJson(req);
  if (!body) return bad("invalid_body");

  const resolved = await resolve(slug, body.token);
  if (resolved instanceof NextResponse) return resolved;
  const { event, guest } = resolved;
  const ctx = await eventContext(event);
  if (ctx.isDraft) return bad("not_active", 403);
  if (!ctx.features.wishes) return bad("not_included", 403);

  const message = cleanText(body.body, MAX_WISH);
  if (!message) return bad("invalid_message");
  const name = guest ? displayName(guest) : cleanText(body.name, MAX_NAME);
  if (!name) return bad("name_required");

  await addWish({ eventId: event.id, guestId: guest?.id, name, body: message });
  return NextResponse.json({ ok: true });
}
