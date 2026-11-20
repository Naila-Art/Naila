import { NextResponse } from "next/server";
import { bad, readJson } from "@/lib/api";
import { guestKey, MAX_GUESTS_PER_IMPORT, validateGuest } from "@/lib/guests";
import { addGuests, deleteGuest, getEventByManageToken, getEventDashboard } from "@/lib/store";

type Ctx = { params: Promise<{ manageToken: string }> };

async function eventFor(ctx: Ctx) {
  const { manageToken } = await ctx.params;
  return getEventByManageToken(manageToken);
}

export async function GET(_req: Request, ctx: Ctx) {
  const event = await eventFor(ctx);
  if (!event) return bad("not_found", 404);
  return NextResponse.json(await getEventDashboard(event.id));
}

/** Body: { guests: [{ title?, name, phone? }] }. Invalid rows and duplicates are skipped and reported. */
export async function POST(req: Request, ctx: Ctx) {
  const event = await eventFor(ctx);
  if (!event) return bad("not_found", 404);
  const body = await readJson(req);
  const input = body?.guests;
  if (!Array.isArray(input) || input.length === 0) return bad("no_guests");
  if (input.length > MAX_GUESTS_PER_IMPORT) return bad("too_many_guests");

  const { guests: existing } = await getEventDashboard(event.id);
  const seen = new Set(existing.map(guestKey));

  const valid = [];
  let invalid = 0;
  let duplicates = 0;
  for (const raw of input) {
    const g = validateGuest(raw && typeof raw === "object" ? raw : {});
    if (g.error) {
      invalid++;
      continue;
    }
    const key = guestKey(g);
    if (seen.has(key)) {
      duplicates++;
      continue;
    }
    seen.add(key);
    valid.push({ title: g.title, name: g.name, phone: g.phone });
  }

  const created = valid.length ? await addGuests(event.id, valid) : [];
  return NextResponse.json({ added: created.length, invalid, duplicates });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const event = await eventFor(ctx);
  if (!event) return bad("not_found", 404);
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return bad("id_required");
  const ok = await deleteGuest(event.id, id);
  return ok ? NextResponse.json({ ok: true }) : bad("not_found", 404);
}
