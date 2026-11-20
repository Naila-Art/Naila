import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { bad, readJson } from "@/lib/api";
import { resolveChangeRequest } from "@/lib/store";

type Ctx = { params: Promise<{ key: string }> };

/** Marks a client's change request as done. Body: { id }. */
export async function PATCH(req: Request, ctx: Ctx) {
  if (!isAdmin((await ctx.params).key)) return bad("not_found", 404);
  const body = await readJson(req);
  if (typeof body?.id !== "string" || !(await resolveChangeRequest(body.id))) return bad("not_found", 404);
  return NextResponse.json({ ok: true });
}
