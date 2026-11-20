import { NextResponse } from "next/server";
import { bad, manageContext, readJson } from "@/lib/api";
import { addChangeRequest } from "@/lib/store";

type Ctx = { params: Promise<{ manageToken: string }> };

/** The client asks us for a change they can't make themselves. Body: { body }. */
export async function POST(req: Request, ctx: Ctx) {
  const found = await manageContext((await ctx.params).manageToken);
  if (!found) return bad("not_found", 404);
  const body = await readJson(req);
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  if (!text || text.length > 1000) return bad("invalid_message");
  const request = await addChangeRequest(found.event.id, text);
  return NextResponse.json({ request }, { status: 201 });
}
