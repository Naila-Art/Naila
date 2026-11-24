import { NextResponse } from "next/server";
import { readJson, resolve } from "@/lib/api";
import { recordView } from "@/lib/store";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = (await readJson(req)) ?? {};
  const resolved = await resolve(slug, body.token);
  if (resolved instanceof NextResponse) return resolved;
  // Previews before payment aren't real opens.
  if (resolved.event.status === "draft") return NextResponse.json({ ok: true });

  await recordView({
    eventId: resolved.event.id,
    guestId: resolved.guest?.id,
    userAgent: req.headers.get("user-agent")?.slice(0, 300) ?? undefined,
  });
  return NextResponse.json({ ok: true });
}
