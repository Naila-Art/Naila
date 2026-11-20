import { NextResponse } from "next/server";
import { bad, cleanText, readJson } from "@/lib/api";
import { getEventByManageToken, updateEventTexts } from "@/lib/store";

const MAX_TEXT = 200;

/** Body: { generalText, personalText }. personalText supports {title} and {name}. */
export async function PUT(req: Request, { params }: { params: Promise<{ manageToken: string }> }) {
  const { manageToken } = await params;
  const event = await getEventByManageToken(manageToken);
  if (!event || event.status === "cancelled") return bad("not_found", 404);

  const body = await readJson(req);
  const generalText = cleanText(body?.generalText, MAX_TEXT);
  const personalText = cleanText(body?.personalText, MAX_TEXT);
  if (!generalText || !personalText) return bad("invalid_text");
  if (!/\{(name|الاسم)\}/.test(personalText)) return bad("name_placeholder_missing");

  await updateEventTexts(event.id, { generalText, personalText });
  return NextResponse.json({ ok: true });
}
