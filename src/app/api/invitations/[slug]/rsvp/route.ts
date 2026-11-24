import { NextResponse } from "next/server";
import { bad, cleanText, MAX_NAME, readJson, resolve } from "@/lib/api";
import { upsertRsvp } from "@/lib/store";
import { eventContext } from "@/lib/event-context";
import { displayName } from "@/lib/text";
import type { RsvpStatus } from "@/lib/types";

const STATUSES: RsvpStatus[] = ["attending", "maybe", "declined"];
const MAX_PARTY = 20;

/** Body: { token?, name? (general link), status, count? (1-20, attending / maybe), note? } */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await readJson(req);
  if (!body) return bad("invalid_body");

  const resolved = await resolve(slug, body.token);
  if (resolved instanceof NextResponse) return resolved;
  const { event, guest } = resolved;
  const ctx = await eventContext(event);
  if (ctx.isDraft) return bad("not_active", 403);
  if (!ctx.showRsvp) return bad("not_included", 403);

  const status = body.status as RsvpStatus;
  if (!STATUSES.includes(status)) return bad("invalid_status");

  let count: number | undefined;
  if (status !== "declined") {
    count = Number(body.count ?? 1);
    if (!Number.isInteger(count) || count < 1 || count > MAX_PARTY) return bad("invalid_count");
  }
  const note = body.note ? cleanText(body.note, 200) : null;
  if (body.note && !note) return bad("invalid_note");

  // Named links already know who the guest is; general links must send a name.
  const name = guest ? displayName(guest) : cleanText(body.name, MAX_NAME);
  if (!name) return bad("name_required");

  const rsvp = await upsertRsvp({ eventId: event.id, guestId: guest?.id, name, status, count, note: note ?? undefined });
  return NextResponse.json({ ok: true, status: rsvp.status, count: rsvp.count });
}
