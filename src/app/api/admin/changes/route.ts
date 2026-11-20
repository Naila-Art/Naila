import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { bad, readJson } from "@/lib/api";
import { resolveChangeRequest } from "@/lib/store";

/** Marks a client's change request as done. Body: { id }. */
export async function PATCH(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;
  const body = await readJson(req);
  if (typeof body?.id !== "string" || !(await resolveChangeRequest(body.id))) return bad("not_found", 404);
  return NextResponse.json({ ok: true });
}
