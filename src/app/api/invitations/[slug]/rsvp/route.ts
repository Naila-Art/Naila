import { NextResponse } from "next/server";
import { bad, cleanText, MAX_NAME, readJson, resolve } from "@/lib/api";
import { upsertRsvp } from "@/lib/store";
import { displayName } from "@/lib/text";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await readJson(req);
  if (!body) return bad("invalid_body");

  const resolved = await resolve(slug, body.token);
  if (resolved instanceof NextResponse) return resolved;
  const { event, guest } = resolved;

  const status = body.status;
  if (status !== "attending" && status !== "declined") return bad("invalid_status");

  // Named links already know who the guest is; general links must send a name.
  const name = guest ? displayName(guest) : cleanText(body.name, MAX_NAME);
  if (!name) return bad("name_required");

  const rsvp = await upsertRsvp({ eventId: event.id, guestId: guest?.id, name, status });
  return NextResponse.json({ ok: true, status: rsvp.status });
}
